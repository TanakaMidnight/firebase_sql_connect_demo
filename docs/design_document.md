# Firebase Data Connect (SQL Connect) デモ用TODOアプリ 設計書 (Docker環境版)

本ドキュメントは、Firebase Data Connect（SQL Connect）および PostgreSQL を使用したデモ用TODOアプリの設計書です。本アプリは、Docker Compose 環境下で PostgreSQL コンテナおよび Firebase エミュレータコンテナを連携させて動作するように設計されています。

---

## 1. システム概要
本アプリケーションは、モダンなUI/UXを備えたタスク管理（TODO）ツールです。
データベースとして PostgreSQL（Docker コンテナ）を利用し、Firebase Data Connect 経由で GraphQL を通じた型安全なクエリとミューテーションを実行します。

### 主な特徴
- **型安全なデータアクセス**: GraphQL スキーマから自動生成される TypeScript SDK を使用。
- **リレーショナルデータモデル**: タスクとカテゴリの 1対多 (1:N) のリレーションシップを実証。
- **完全 Docker 化**: ローカルホストに Node.js、Java、PostgreSQL などのランタイムをインストールすることなく、`docker compose up` のみで開発環境全体を起動可能。
- **プレミアムな UI デザイン**: グラスモーフィズム（Glassmorphism）、スムーズなアニメーション、および洗練されたダークモードを採用。

---

## 2. システムアーキテクチャ

```mermaid
graph TD
    subgraph Host [ホストマシン (Browser)]
        Browser[Webブラウザ (localhost:5173)]
        EmulatorUI[エミュレータ UI (localhost:4000)]
    end

    subgraph Docker_Compose [Docker Compose 環境]
        subgraph App_Container [app コンテナ (Node.js + JRE)]
            Vite[Vite Dev Server :5173]
            FDC[Data Connect エミュレータ :9399]
            SDK[Generated TypeScript SDK]
        end

        subgraph DB_Container [db コンテナ (PostgreSQL 16)]
            Postgres[(PostgreSQL :5432)]
        end

        Browser -->|HTTP/Websocket| Vite
        Browser -->|HTTP| EmulatorUI
        FDC -->|TCP/SQL| Postgres
        SDK -->|GraphQL/HTTP| FDC
    end
```

### 技術スタック
- **フロントエンド**: Vite, React, TypeScript, CSS (Vanilla CSS, ダークモード/アニメーション)
- **バックエンド/API レイヤー**: Firebase Data Connect (SQL Connect)
- **データベース**: PostgreSQL 16 (Docker コンテナ)
- **コンテナ環境**: Docker, Docker Compose

---

## 3. データベース設計 (GraphQL スキーマ)

`schema.gql` に GraphQL スキーマ定義を記述することで、PostgreSQL のテーブルが自動生成されます。

### 3.1 テーブル定義

#### 1. `Category` (カテゴリ情報)
タスクを分類するためのカテゴリ。

| フィールド名 | GraphQL 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `UUID!` | 主キー, 自動生成 | カテゴリID |
| `name` | `String!` | ユニーク | カテゴリ名 (例: 仕事, プライベート, 学習) |
| `color` | `String!` | デフォルト `#6366f1` | UI表示用のカラーコード (Hex) |

#### 2. `Todo` (TODO項目)
実際のタスク情報。`Category` とのリレーションを持ちます。

| フィールド名 | GraphQL 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `UUID!` | 主キー, 自動生成 | タスクID |
| `title` | `String!` | - | タスクのタイトル |
| `description` | `String` | - | タスクの詳細説明 |
| `isCompleted` | `Boolean!` | デフォルト `false` | 完了フラグ |
| `dueDate` | `Date` | - | 期限日 |
| `priority` | `String!` | デフォルト `medium` | 優先度 (`high`, `medium`, `low`) |
| `categoryId` | `UUID` | 外部キー (Category.id) | 関連するカテゴリのID |
| `createdAt` | `Timestamp!` | 自動生成 (`@default(expr: "request.time")`) | 作成日時 |
| `updatedAt` | `Timestamp!` | 自動生成 (`@default(expr: "request.time")`) | 更新日時 |

---

## 4. API 設計 (GraphQL クエリ/ミューテーション)

`connector.yaml` で定義されたコネクタに基づき、以下のクエリとミューテーションをクライアント向けに公開します。

### 4.1 Queries (参照系)
- **`listTodos`**: すべての TODO または特定のフィルタ（完了/未完了、カテゴリなど）に一致する TODO の一覧を取得（関連するカテゴリ情報も結合して取得）。
- **`listCategories`**: 登録されているすべてのカテゴリ一覧を取得。

### 4.2 Mutations (更新系)
- **`createTodo`**: 新しい TODO を追加。
- **`updateTodo`**: TODO のタイトル、説明、完了ステータス、優先度、期限、カテゴリを変更。
- **`deleteTodo`**: TODO を削除。
- **`createCategory`**: 新しいカテゴリを作成。

---

## 5. Docker および Firebase 設定

### 5.1 `docker-compose.yml`
PostgreSQL と Firebase CLI が同居するコンテナ環境を定義します。

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: fdc-postgres-db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: tododb
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - fdc-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: fdc-app
    ports:
      - "5173:5173"   # Vite
      - "4000:4000"   # Firebase Emulator UI
      - "9399:9399"   # Data Connect Emulator
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: sh -c "npm install && firebase emulators:start --import=./.emulator_data --export-on-exit=./.emulator_data & npm run dev -- --host"
    depends_on:
      - db
    networks:
      - fdc-network

volumes:
  pgdata:

networks:
  fdc-network:
    driver: bridge
```

### 5.2 `Dockerfile` (app用)
Node.js と Firebase エミュレータに必要な Java Runtime (JRE)、および Firebase CLI を含むイメージを作成します。

```dockerfile
FROM node:20-alpine

# JRE と bash をインストール
RUN apk add --no-cache openjdk17-jre bash

# Firebase CLI をインストール
RUN npm install -g firebase-tools

WORKDIR /app

EXPOSE 5173 4000 9399
```

### 5.3 `firebase.json`
Data Connect エミュレータが `db` コンテナの PostgreSQL に接続するように指定します。

```json
{
  "dataconnect": {
    "source": "dataconnect"
  },
  "emulators": {
    "dataconnect": {
      "port": 9399,
      "host": "0.0.0.0",
      "postgres": {
        "connectionString": "postgresql://postgres:mysecretpassword@db:5432/tododb?sslmode=disable"
      }
    },
    "ui": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 4000
    }
  }
}
```

### 5.4 `dataconnect/dataconnect.yaml`
Firebase Data Connect サービスの設定ファイルです。

```yaml
specVersion: "v1beta"
serviceId: "todo-service"
location: "us-central1"
schema:
  source: "schema"
  datasource:
    postgresql:
      database: "tododb"
      cloudSql:
        instanceId: "todo-instance"
connectorDirs:
  - "connector"
```

### 5.5 `dataconnect/connector/connector.yaml`
```yaml
connectorId: "todo-connector"
generate:
  javascriptSdk:
    outputDir: "../src/generated/dataconnect"
    packageJsonDir: "../"
```

---

## 6. フロントエンド設計 (UI/UX)
※ 画面構成およびデザインシステムは、PGLite版と同様にグラスモーフィズムを基調としたダークモードを採用します（[設計書(PGLite版)](file:///c:/Users/tanaka/Documents/GitHub/firebase_sql_connect_demo/docs/design_document.md) 参照）。

---

## 7. 開発・実行手順

### 起動方法
1. プロジェクトのルートディレクトリに移動します。
2. 以下のコマンドを実行してコンテナをビルドし、起動します。
   ```bash
   docker compose up --build
   ```
3. 起動後、自動的に `npm install` と Firebase Emulator Suite、および Vite 開発サーバーが立ち上がります。

### アクセス
- **フロントエンド**: [http://localhost:5173](http://localhost:5173)
- **Firebase Emulator UI**: [http://localhost:4000](http://localhost:4000)
- **Data Connect API エンドポイント**: [http://localhost:9399](http://localhost:9399)

### データの永続化
- PostgreSQL のデータは Docker ボリューム `pgdata` を介して永続化されます。
- Firebase Emulator のメタデータ（認証などの状態がある場合）は `./.emulator_data` に保存・エクスポートされます。
