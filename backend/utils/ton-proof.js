import { createHash } from 'crypto';
import { Address } from 'ton';
import nacl from 'tweetnacl';
import axios from 'axios';

const tonProofPrefix = 'ton-proof-item-v2/';
const tonConnectPrefix = 'ton-connect';

function SignatureVerify(pubkey, message, signature) {
  return nacl.sign.detached.verify(message, signature, pubkey);
}

async function CreateMessage(message) {
  const wc = Buffer.alloc(4);
  wc.writeUint32BE(message.Workchain);

  const ts = Buffer.alloc(8);
  ts.writeBigUint64LE(BigInt(message.Timstamp));

  const dl = Buffer.alloc(4);
  dl.writeUint32LE(message.Domain.LengthBytes);

  const m = Buffer.concat([
    Buffer.from(tonProofPrefix),
    wc,
    message.Address,
    dl,
    Buffer.from(message.Domain.Value),
    ts,
    Buffer.from(message.Payload),
  ]);

  const messageHash = createHash('sha256').update(m).digest();

  const fullMes = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from(tonConnectPrefix),
    Buffer.from(messageHash),
  ]);

  const res = createHash('sha256').update(fullMes).digest();
  return Buffer.from(res);
}

function ConvertTonProofMessage(walletInfo, tp) {
  const address = Address.parse(walletInfo.account.address);

  const res = {
    Workchain: address.workChain,
    Address: address.hash,
    Domain: {
      LengthBytes: tp.proof.domain.lengthBytes,
      Value: tp.proof.domain.value,
    },
    Signature: Buffer.from(tp.proof.signature, 'base64'),
    Payload: tp.proof.payload,
    StateInit: walletInfo.account.walletStateInit,
    Timstamp: tp.proof.timestamp,
  };
  return res;
}

async function checkTonProof(proof, wallet) {
  const parsedMessage = ConvertTonProofMessage(wallet, proof);
  const checkMessage = await CreateMessage(parsedMessage);

  const response = await axios.post(
    `https://${wallet.account.chain === '-3' ? 'testnet.' : ''}tonapi.io/v2/tonconnect/stateinit`,
    { state_init: wallet.account.walletStateInit }
  );

  const pubkey = Buffer.from(response.data.public_key, 'hex');

  const verifyRes = SignatureVerify(pubkey, checkMessage, parsedMessage.Signature);

  if (!verifyRes) {
    return false;
  }

  return { status: true, walletAddress: response.data.address };
}

export { checkTonProof };
