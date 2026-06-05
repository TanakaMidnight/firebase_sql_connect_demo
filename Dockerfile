# ベースイメージとしてNode.js 20 (Alpine Linux版) を使用
FROM node:20-alpine

# Firebase エミュレータを実行するためにJava (JRE) が必要なため、OpenJDK 17 をインストール
# また、トラブルシューティングやシェル実行に便利な bash もインストール
RUN apk add --no-cache openjdk17-jre bash

# Firebase CLI をグローバルにインストール
RUN npm install -g firebase-tools

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# 各ポートを公開
# 5173: Vite フロントエンド開発サーバー
# 4000: Firebase Emulator UI
# 9399: Firebase Data Connect エミュレータ
EXPOSE 5173 4000 9399
