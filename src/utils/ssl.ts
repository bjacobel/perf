import pem from 'pem';
import path from 'path';
import { promises } from 'fs';
import execa from 'execa';
const fs = promises;

interface Certificate {
  serviceKey: string;
  clientKey: string;
  csr: string;
  certificate: string;
}

let memoizedCert: Certificate;

const genCert = async (): Promise<Certificate> => {
  if (memoizedCert) return Promise.resolve(memoizedCert);

  const openssl = await execa('which', ['openssl']);
  return new Promise(async (resolve, reject) => {
    pem.config({
      pathOpenSSL: openssl.stdout,
    });
    pem.createCertificate(
      {
        days: 1,
        selfSigned: false,
        serviceCertificate: await caCrt(),
        serviceKey: await caKey(),
      },
      (err, certificate: Certificate) => {
        if (err) reject(err);
        memoizedCert = certificate;
        resolve(certificate);
      },
    );
  });
};

export const caKey = async (): Promise<string> =>
  fs.readFile(path.join(__dirname, '../../data/caKey.pem'), 'utf-8');
export const caCrt = async (): Promise<string> =>
  fs.readFile(path.join(__dirname, '../../data/caCrt.pem'), 'utf-8');

export const key = async (): Promise<string> => (await genCert()).clientKey;
export const cert = async (): Promise<string> => (await genCert()).certificate;
