# QUFA Promptech

> `QUFA - 데이터 품질/공정성 통합 관리 시스템`

## 1. Environment

- nodeJS v14.17.5
- MySQL 8.0.x

## 2. Installation

### [db-migrate](https://github.com/db-migrate/node-db-migrate#readme)

- database-sample.json 참고하여 database.json 생성

```sh
# migration 생성 (별도의 sql 파일 생성하여 migration 정보 관리)
> db-migrate create MIGRATION_NAME --sql-file

# run migration
> db-migrate up
```
