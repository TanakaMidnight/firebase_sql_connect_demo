import { initializeApp } from 'firebase/app';
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
// 自動生成される SDK 設定パッケージをインポート
import { connectorConfig } from '@firebasegen/todo-connector';

// デモ用の Firebase 構成情報 (エミュレータを使用するためダミー値で問題ありません)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

// Firebase アプリの初期化
const app = initializeApp(firebaseConfig);

// Data Connect コネクタの初期化
export const dataConnect = getDataConnect(app, connectorConfig);

// 開発環境の場合は、ローカルの Data Connect エミュレータに接続
if (import.meta.env.DEV) {
  // ブラウザ（ホスト）から見て localhost:9399 で稼働しているエミュレータに接続します
  connectDataConnectEmulator(dataConnect, 'localhost', 9399);
  console.log("Firebase Data Connect Emulator に接続しました。");
}
