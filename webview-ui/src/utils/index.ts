import { get } from 'lodash';
import axios from 'axios';
export { vscode } from './vscode';
export const sleep = (ms: number = 3000) => new Promise(resolve => setTimeout(resolve, ms));

export function generateRandom() {
  return Math.random().toString(36).substring(2, 6);
}

export function getLanguage() {
  return get(window, 'XSAHXL_CONFIG.lang', 'zh');
}

export function request(url: string, maxRetryCount: number = 3) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    function makeRequest() {
      axios
        .get(url, { timeout: 10000 })
        .then(response => {
          resolve(get(response, 'data', {}));
        })
        .catch(error => {
          if (retryCount < maxRetryCount) {
            retryCount++;
            setTimeout(makeRequest, 3000);
          } else {
            reject(error);
          }
        });
    }
    makeRequest();
  });
}
