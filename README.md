# QUFA Promptech

> `QUFA - 데이터 품질/공정성 통합 관리 시스템`

## 1. Environment

- nodeJS v14.17.5
- MySQL 8.0.x

## 2. Installation

### [Sequelize ORM](https://sequelize.org/)

- config/config-sample.json 참고하여 config.json 생성

```sh
# model 및 migration 생성
# model 생성 후 tableName 설정 추가 필요(Case 문제)
> npx sequelize-cli model:generate --name Data --attributes name:string,contentType:string,fileSize:bigint,remotePath:string,originFileName:string,dataTable:string

> npx sequelize-cli model:generate --name Meta --attributes dataId:integer,name:string,koName:string,colType:string,maxLength:integer,floatLength:integer,dateFormat:string,trueValue:string,isNotNull:boolean,isUnique:boolean,isIndex:boolean

# run migration (config 관리를 위해 별도 관리)
> npx sequelize-cli db:migrate --config=./configs/db.config.json
```
