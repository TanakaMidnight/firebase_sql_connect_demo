# Firebase Data Connect (SQL Connect) デモ用TODOアプリ

本リポジトリは、**Firebase Data Connect（SQL Connect）** と **PostgreSQL** を活用した、型安全でリレーショナルなデモ用TODOアプリケーションです。
Docker Compose 環境下で、ローカルデータベース（Postgres）と Firebase ローカルエミュレータ、フロントエンドがすべて自動的に起動・連携するように設計されています。

---

## 🚀 主な機能

- **TODO（タスク）の管理**: 追加、更新（完了状態のトグル）、削除。
- **リレーショナルデータモデル**: 各TODOに対する「カテゴリ」（Hexカラーコード付き）の紐付け。
- **ダッシュボード（統計情報）**: 全タスク数、完了済み、未完了、期限切れタスク数のリアルタイムサマリー表示。
- **期限切れハイライト**: 期限が現在時刻を過ぎた未完了タスクの視覚的強調。
- **プレミアム UI デザイン**: グラスモーフィズムを基調とし、滑らかなアニメーション、および洗練されたダークモードを採用。

---

## 🛠 システムアーキテクチャ

```
  【ブラウザ (ホスト)】
    - フロントエンド (localhost:5173)
    - エミュレータ UI (localhost:4000)
         │
         ▼ (コンテナネットワーク経由)
  【Docker Compose 環境】
    ┌─────────────────────────┐
    │  app コンテナ           │
    │  - Vite Dev Server      │
    │  - Data Connect Emulator│ ◄───┐
    └─────────────────────────┘     │ (TCP / SQL 接続)
    ┌─────────────────────────┐     │
    │  db コンテナ            │ ────┘
    │  - PostgreSQL 16        │
    └─────────────────────────┘
```

---

## 💻 起動方法

ローカルマシン上で Docker Desktop が起動している必要があります。

### 1. リポジトリの準備とビルド・起動

ターミナルで本プロジェクトのルートディレクトリに移動し、以下のコマンドを実行します。

```bash
docker compose up --build
```

- コンテナの初回ビルド時に `npm install` や必要なランタイムのセットアップが自動で行われます。
- Firebase エミュレータ起動時に、`src/generated/dataconnect` に TypeScript クライアント SDK が自動生成されます。

### 2. アプリへのアクセス

| サービス名               | アクセス URL                                   | 説明                       |
| :----------------------- | :--------------------------------------------- | :------------------------- |
| **TODO アプリ (Vite)**   | [http://localhost:5173](http://localhost:5173) | タスク管理画面（メインUI） |
| **Firebase Emulator UI** | [http://localhost:4000](http://localhost:4000) | エミュレータ統合管理画面   |
| **Data Connect API**     | [http://localhost:9399](http://localhost:9399) | GraphQL エンドポイント     |

---

## 📂 主要なプロジェクト構造

```text
├── Dockerfile                  # app用コンテナ定義（Node.js, JRE, Firebase CLI）
├── docker-compose.yml          # Postgres および app コンテナの Compose 定義
├── firebase.json               # Firebase エミュレータおよび PostgreSQL 接続文字列定義
├── docs/
│   └── design_document.md      # 詳細なテーブル定義・API設計書
├── dataconnect/
│   ├── dataconnect.yaml        # Data Connect サービス構成定義
│   ├── schema/
│   │   └── schema.gql          # GraphQL データベーススキーマ（Todo & Category）
│   └── connector/
│       ├── connector.yaml      # クライアントSDKの生成設定
│       ├── queries.gql         # 参照系クエリ（ListTodos, ListCategories）
│       └── mutations.gql       # 更新系クエリ（CreateTodo, UpdateTodo 等）
├── src/
│   ├── App.tsx                 # アプリのメイン画面（React UI & Logic）
│   ├── firebase.ts             # Firebase / Data Connect SDK 初期化およびエミュレータ接続
│   └── index.css               # グラスモーフィズム＆ダークテーマのスタイル
```

---

## 📚 ドキュメント情報

- **詳細設計書**: テーブル構造、GraphQL API 設計、デザインシステムなどについては [docs/design_document.md](docs/design_document.md) を参照してください。
