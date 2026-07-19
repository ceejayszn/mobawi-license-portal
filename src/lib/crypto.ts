import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, decodeUTF8 } from 'tweetnacl-util';
import { prisma } from './prisma';
import crypto from 'crypto';

export async function getSystemKeypair() {
  let privateKeySetting = await prisma.setting.findUnique({ where: { key: 'private_key' } });
  let publicKeySetting = await prisma.setting.findUnique({ where: { key: 'public_key' } });

  if (!privateKeySetting || !publicKeySetting) {
    const keypair = nacl.sign.keyPair();
    const privBase64 = encodeBase64(keypair.secretKey);
    const pubBase64 = encodeBase64(keypair.publicKey);

    await prisma.setting.upsert({
      where: { key: 'private_key' },
      update: { value: privBase64 },
      create: { key: 'private_key', value: privBase64 },
    });

    await prisma.setting.upsert({
      where: { key: 'public_key' },
      update: { value: pubBase64 },
      create: { key: 'public_key', value: pubBase64 },
    });

    return { privateKey: keypair.secretKey, publicKey: keypair.publicKey, pubBase64 };
  }

  return {
    privateKey: decodeBase64(privateKeySetting.value),
    publicKey: decodeBase64(publicKeySetting.value),
    pubBase64: publicKeySetting.value
  };
}

function generateHumanCode() {
  const bytes = crypto.randomBytes(15);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += chars[bytes[i] % chars.length];
  }
  return str.match(/.{1,4}/g)?.join('-') || str;
}

export async function generateLicensePayload(appId: number, deviceId: string, issueDate: Date, expiryDate: Date, type: string, status: string) {
  const { privateKey } = await getSystemKeypair();
  const salt = crypto.randomBytes(4).toString('hex');
  
  const payloadData = {
    v: "1",
    app: appId,
    dev: deviceId,
    iss: issueDate.toISOString(),
    exp: expiryDate.toISOString(),
    typ: type,
    st: status,
    slt: salt
  };

  const payloadString = JSON.stringify(payloadData);
  const messageUint8 = decodeUTF8(payloadString);
  const signature = nacl.sign.detached(messageUint8, privateKey);
  
  const humanCode = generateHumanCode();
  
  const finalBlob = encodeBase64(decodeUTF8(JSON.stringify({
    code: humanCode,
    payload: payloadData,
    sig: encodeBase64(signature)
  })));

  return {
    salt,
    signature: encodeBase64(signature),
    humanCode,
    licenseBlob: finalBlob
  };
}
