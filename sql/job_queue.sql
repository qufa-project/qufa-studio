create table job_queue
(
    id           int auto_increment primary key,
    retry_cnt    int      default 0                 null,
    status       varchar(255)                       null,
    target_title varchar(255)                       null,
    created_at   datetime default CURRENT_TIMESTAMP null,
    updated_at   datetime default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
);