use axum::{routing::post, Json, Router, extract::State};
use ethers::{
    core::types::{transaction::eip712::Eip712, Address, H256, U256},
    signers::{LocalWallet, Signer},
    types::Eip712Domain,
    utils::{keccak256, hex::ToHex},
};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{collections::{HashSet, HashMap}, env, net::SocketAddr, str::FromStr, sync::Arc};
use thiserror::Error;
use tokio::sync::RwLock;
use tower_http::trace::TraceLayer;
use tracing::{info};

#[derive(Clone)]
struct AppState {
    seen_hashes: Arc<RwLock<HashSet<H256>>>,   // dedupe
    allowlist: Arc<RwLock<HashSet<Address>>>,  // creator allowlist
    wallet: LocalWallet,
    domain: Eip712Domain,
}

#[derive(Debug, Deserialize)]
struct ValidateReq {
    creator: String,   // creator that must be allowlisted
    to: String,        // recipient that will receive the NFT
    uri: String,       // arbitrary metadata URI (hash checked only)
    sha256: String,    // 0x… 32 bytes
    // optional: client-passed nonce; if absent, we use per-recipient auto nonce
    nonce: Option<String>,
    deadline: u64,
}

#[derive(Debug, Serialize)]
struct ValidateResp {
    permit: MintPermitJson,
    signature: String, // 0x… r||s||v
    validator: String, // 0x… address
}

#[derive(Debug, Serialize)]
struct MintPermitJson {
    to: String,
    uriHash: String,
    artHash: String,
    nonce: String,
    deadline: String,
}

#[derive(Debug, Clone, Eip712)]
#[eip712(name = "ArtChain", version = "1")]
struct MintPermit {
    #[eip712] to: Address,
    #[eip712] uriHash: [u8; 32],
    #[eip712] artHash: [u8; 32],
    #[eip712] nonce: U256,
    #[eip712] deadline: U256,
}

#[derive(Debug, Default)]
struct NonceBook(Arc<RwLock<HashMap<Address, U256>>>);

#[derive(Error, Debug)]
enum MinerError {
    #[error("bad hex")]
    BadHex,
    #[error("invalid address")]
    BadAddr,
    #[error("creator not allowlisted")]
    NotAllowed,
    #[error("duplicate art hash")]
    Duplicate,
    #[error("{0}")]
    Other(String),
}
impl axum::response::IntoResponse for MinerError {
    fn into_response(self) -> axum::response::Response {
        use axum::http::StatusCode;
        let code = match self {
            MinerError::BadHex | MinerError::BadAddr => StatusCode::BAD_REQUEST,
            MinerError::Duplicate => StatusCode::CONFLICT,
            MinerError::NotAllowed => StatusCode::FORBIDDEN,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };
        (code, self.to_string()).into_response()
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();

    // --- env ---
    let privkey = env::var("VALIDATOR_PRIVKEY").expect("set VALIDATOR_PRIVKEY 0x..");
    let chain_id: u64 = env::var("CHAIN_ID").unwrap_or_else(|_| "11155111".into()).parse()?;
    let verifying_contract = Address::from_str(&env::var("VERIFYING_CONTRACT").expect("set VERIFYING_CONTRACT"))?;
    let allowlist_env = env::var("ALLOWLIST").unwrap_or_default(); // comma-separated 0x.. addresses

    let wallet: LocalWallet = privkey.parse::<LocalWallet>()?.with_chain_id(chain_id);
    let domain = Eip712Domain {
        name: Some("ArtChain".into()),
        version: Some("1".into()),
        chain_id: Some(chain_id.into()),
        verifying_contract: Some(verifying_contract),
        salt: None,
    };

    let mut set = HashSet::new();
    for a in allowlist_env.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()) {
        set.insert(Address::from_str(a).expect("bad ALLOWLIST entry"));
    }

    let state = AppState {
        seen_hashes: Arc::new(RwLock::new(HashSet::new())),
        allowlist: Arc::new(RwLock::new(set)),
        wallet,
        domain,
    };

    let app = Router::new()
        .route("/validate", post(validate))
        .with_state(state)
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = "0.0.0.0:8080".parse().unwrap();
    info!("ArtChain Miner listening on http://{addr}");
    axum::Server::bind(&addr).serve(app.into_make_service()).await?;
    Ok(())
}

async fn validate(State(state): State<AppState>, Json(req): Json<ValidateReq>)
-> Result<Json<ValidateResp>, MinerError> {
    let creator = Address::from_str(&req.creator).map_err(|_| MinerError::BadAddr)?;
    let to = Address::from_str(&req.to).map_err(|_| MinerError::BadAddr)?;
    let art_hash = parse_h256(&req.sha256).ok_or(MinerError::BadHex)?;
    let uri_hash = H256::from(keccak256(req.uri.as_bytes()));
    let deadline = U256::from(req.deadline);

    // allowlist
    if !state.allowlist.read().await.contains(&creator) {
        return Err(MinerError::NotAllowed);
    }
    // dedupe
    {
        let mut seen = state.seen_hashes.write().await;
        if !seen.insert(art_hash) {
            return Err(MinerError::Duplicate);
        }
    }
    // nonce: if provided use it; else derive per-recipient counter (simple)
    static NONCES: Lazy<NonceBook> = Lazy::new(|| NonceBook::default());
    let nonce = match &req.nonce {
        Some(s) => U256::from_dec_str(s).map_err(|e| MinerError::Other(e.to_string()))?,
        None => {
            let mut book = NONCES.0.write().await;
            let entry = book.entry(to).or_insert(U256::zero());
            let current = *entry;
            *entry = current + U256::one();
            current
        }
    };

    let permit = MintPermit {
        to,
        uriHash: uri_hash.0,
        artHash: art_hash.0,
        nonce,
        deadline,
    };

    let digest = permit.encode_eip712_with_domain(&state.domain)
        .map_err(|e| MinerError::Other(e.to_string()))?;
    let sig = state.wallet.sign_hash(digest).await
        .map_err(|e| MinerError::Other(e.to_string()))?;

    let resp = ValidateResp {
        permit: MintPermitJson {
            to: format!("{to:#x}"),
            uriHash: format!("0x{}", uri_hash.encode_hex::<String>()),
            artHash: format!("0x{}", art_hash.encode_hex::<String>()),
            nonce: nonce.to_string(),
            deadline: deadline.to_string(),
        },
        signature: format!("{sig:#x}"),
        validator: format!("{:#x}", state.wallet.address()),
    };
    Ok(Json(resp))
}

fn parse_h256(s: &str) -> Option<H256> {
    let s = s.strip_prefix("0x").unwrap_or(s);
    let bytes = hex::decode(s).ok()?;
    if bytes.len() != 32 { return None; }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Some(H256::from(arr))
}
