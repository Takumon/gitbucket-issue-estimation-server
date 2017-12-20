[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

## GitBucketのissueで作業量が見積れるようになるサービス
* Dockerで簡単インストール
* ChromeExtensionと合わせて使用

## License
MIT

## インストール方法
* docker-compose.yml作成
※db-viewerは必要に応じて

```
version: "3.3"
services:
  server:
    image: takumon/gitbucket-issue-estimation-server
    ports:
      - 3000:3000
    depends_on:
      - mongo
    links:
      - mongo
    environment:
      MONGO_URL: mongodb://mongo:27017/test
  mongo:
    image: mongo:3.5.12
    ports:
      - 27017:27017
    volumes:
      - ./db:/data/db
  db-viewer:
    image: mongo-express:latest
    ports:
     - 8082:8081
    depends_on:
      - mongo
    links:
     - mongo
```

* コンテナを起動

```
$ docker-compose up -d
```

* ブラウザで`http://localhost:3000`にアクセス

## 構成
* サーバ ・・・ Express v4
* DBアクセス ・・・ mongoose v4
* 実行環境 ・・・Node v8
* DB ・・・ MongoDB v3
