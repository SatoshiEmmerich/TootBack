##########################################################
#### ビルドステージ
FROM node:18.14.2-alpine as builder
WORKDIR /app

# ビルド用の依存パッケージをインストール
COPY package.json .
RUN npm install

# TypeScript コードをコピーしてビルド
COPY src ./src
COPY tsconfig.json .
RUN npm run build

##########################################################
#### 実行用イメージの作成
FROM node:18.14.2-alpine as runner
WORKDIR /app

# 本番環境用のパッケージをインストール
COPY package.json .
RUN npm install --omit=dev && npm cache clean --force

# builder からビルド結果だけコピー
COPY --from=builder /app/public/ .
# バッチ設定ファイル
COPY config.json ./

# Node.js アプリを起動
CMD ["node", "./js/index.js", "./config.json"]