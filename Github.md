# Design Github

# Table of contents

- [Functional requirements](#1-functional-requirements)
- [Non-functional requirements](#2-non-functional-requirements)
- [Capacity estimation](#3-capacity-estimation)
- [Database design](#4-database-design)
- [API design](#5-api-design)
- [High-level design](#6-high-level-design)

# 1. Functional requirements

1. Users can create, update and manage their own profiles.
2. Users can create, fork and star repositories.
3. Users can create public/private repositories.
4. Users can follow other users.

Future extensions:

5. Every commit version should be stored. So that users can view or rebase to any of the previous commits.
6. Users can clone repositories locally.
7. Users can be under organizations.
8. Managing issues and pull requests.
9. Branches
10. Notifications

# 2. Non-functional requirements

1. The repository size should be strictly less than 25 MB.
2. Latency for fetching code should be kept at 10 ms.
3. System should be highly reliable. No uploaded code should ever be lost.
4. Consistency during fetching code can take a hit. If a user does not see code for a while, that is fine.

# 3. Capacity estimation

|                                                       |          |
| ----------------------------------------------------- | -------- |
| Total number of users                                 | 50M      |
| Daily active users (10%)                              | 5M       |
| Number of new repositories created per user every day | 2        |
| Read/Write ratio                                      | 10:1     |
| Average repository size                               | 1 MB     |
| Data stored for                                       | 10 years |

### QPS

- Total new repositories created every day: 5M \* 2 repos -> 10M
- Write QPS: 10M/24h/3600s -> ~115
- Peak QPS: 2 \* QPS -> 2\*115 -> 230

- Read QPS: 10 \* Write QPS -> 1150
- Peak read QPS: 2 \* Read QPS -> 2300

### Storage estimation

- Average repository size 1 MB
- Total new repositories created every day: 5M \* 2 repos -> 10M
- Data storage estimation (per day): 10M \* 1MB -> 10 GB
- Data storage estimation (for 10 years): 10GB\*365d\*10y -> 36.5 TB

# 4. Database design

| User        |        | Repository          |                               | Star          |               | Followers    |               |
| ----------- | ------ | ------------------- | ----------------------------- | ------------- | ------------- | ------------ | ------------- |
| id          | PK     | id                  | PK                            | id            | PK            | id           | PK            |
| username    | unique | owner_id            | FK to User.id                 | repository_id | FK            | follower_id  | FK to User.id |
| email       | unique | name                |                               | user_id       | FK to User.id | following_id | FK to User.id |
| password    |        | description         |                               | created_at    |               | created_at   |               |
| bio         |        | visibility_status   | ENUM: public/private          |               |               |              |               |
| avatar_url  |        | forked_from_repo_id | Nullable. FK to Repository.id |               |               |              |               |
| verified_at |        | created_at          |                               |               |               |              |               |
| created_at  |        | updated_at          |                               |               |               |              |               |
| updated_at  |        |                     |                               |               |               |              |               |

- A user can create many repositories. **User-Repository: One-to-many relationship**
- A repository can be forked by many users. **Repository-Fork: One-to-many relationship**
- Many users could star a repository. **Star: Pivot table**
- A user can follow many other users. **Followers: Pivot table**

# 5. API design

```bash
# Authentication
POST    /signup
POST    /signin
POST    /email-verification
POST    /signout
POST    /password-reset

# User Profile
GET     /user/{username}
PATCH   /user
POST    /user/follow?target=username
GET     /user/username/followers
GET     /user/username/following

# Repository
POST    /repository
    {
        username: a
        repository_name: ..
        visibility_status: public/private
    }
GET     /username/repository_name
PATCH   /username/repository_name
DELETE  /username/repository_name
GET     /user/username/repositories
GET     /repositories/search?q=...

# Code
GET     /username/repository_name/..

# Fork
POST    /username/repository_name/fork
DELETE  /username/repository_name/fork
GET     /username/repository_name/forks

# Star
POST    /username/repository_name/star
GET     /username/repository_name/stars
DELETE  /username/repository_name/star
```

# 6. High-level design

```bash
            +---------+
            |  Client |
            +----+----+
                 |
                 v
         +---------------+
         | Load Balancer |
         +-------+-------+
                 |
                 v
         +---------------+       +------------------+
         |  API Servers  +------>| Relational DB    |
         +-------+-------+       +------------------+
                 |
                 v
         +---------------+
         | Cache (Redis) |
         +---------------+
                 |
       +------------------------+
       | Returns signed URL for |
       | code blob in S3 via CDN|
       +------------------------+
                 |
                 v
            +------+
            |  CDN |
            +--+---+
               |
               v
             +---+
             |S3 |
             +---+


# Upload path
Client -> LB -> API -> S3

# Download path
Client -> CDN -> S3 (if cache miss)
```

### Key points to remember

- Client: Web browser/Mobile frontend/CLI(git)
- Load Balancer: Can be a layer 7 load balancer (e.g. ALB, NGINX)
- API Servers: Stateless. Handles auth, business logic and serving metadata from the relational DB. Can be scaled horizontally.
- Relational Database: PostgreSQL/MySQL. Might need replicas, backups, possible indexing and sharding.
- Object Storage: S3/GCS. Stores code blobs. Might need lifecycle management, encryption, presigned URLs for downloads.
- CDNs: Fronts S3. Low latency fetches. Clients hit the CDN (via the presigned URL), not the backend server.
- Caching Layer: Redis/Memcached. Might use for hot metadata such as User profiles, repo details, star counts.
- Async Processing: Sending emails/notifications.
- Monitoring
