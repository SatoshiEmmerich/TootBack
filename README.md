# tootback_batch

ローカル実行するにはサービスアカウントの認証情報が必要。 `secrets` フォルダに GCP からダウンロードしたキーファイルを保管すること。

**キーファイルをリポジトリに上げたり漏洩させたりしないこと！**

このファイルを起動時に読み込ませるために、 `launch.json` で環境変数をセットする必要がある。

```json
"configurations": [
  {
    ...
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "${workspaceFolder}/secrets/tootback-serviceAccount.json",
    }
  }
]
```
