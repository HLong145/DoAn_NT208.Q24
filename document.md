# Project Report

## 1. Project Requirement

This project is a Twitter-like microblogging system. The requirement is to deliver a social platform where users can register, sign in, post short updates, interact with other users, and see live activity in a timeline-style interface.

The expected product scope includes:

- authentication and account lifecycle
- tweet creation, reposting, and tweet detail view
- follow and unfollow behavior
- likes, comments, and reply interactions
- bookmarks / saved posts
- direct messages / private inbox
- notifications for user activity
- search and discovery for tweets and people
- a real news feed or timeline experience
- WebSocket realtime updates
- caching, scalability, and performance benchmarking

The target outcome is a unified application where the frontend, backend, database, realtime layer, and cache work together as one system.

## 2. Tech Stack

### 2.1 Frontend stack

- React 19 for the UI layer
- Vite for development and production builds
- TypeScript for type safety
- React Router for page navigation
- Socket.IO client for realtime messages
- LocalStorage for session and preference persistence
- CSS variables and custom theme classes for display settings

### 2.2 Backend stack

- NestJS 11 as the main backend framework
- TypeORM for persistence and entity mapping
- MySQL as the primary relational database
- Redis for caching
- Kafka for async social events
- Socket.IO / NestJS WebSocket gateway for realtime push
- JWT for authentication
- bcrypt for password hashing

### 2.3 Supporting services

- Docker Compose for local infrastructure orchestration
- phpMyAdmin for MySQL inspection
- Zookeeper and Kafka broker for event streaming

## 3. Project Infrastructure

### 3.1 Frontend

The `Evolix/` folder is the frontend application. It contains the public UI, routing, layout shell, theme system, and API client layer. This is the user-facing part of the product.

### 3.2 Backend

The `Evolix_backend/` folder is the canonical backend. It owns the main social business logic and currently handles auth, users, tweets, follows, likes, comments, notifications, bookmarks, direct messages, and realtime delivery.

### 3.3 Legacy backend

The `Evolix/server/` folder is a separate Express auth backend that still exists in the workspace. It appears to be an older or parallel auth implementation and is not the canonical NestJS backend.

### 3.4 Empty backend folder

The `Evolix_backend2/` folder is empty and does not currently contribute code.

### 3.5 Data flow overview

- React UI calls backend APIs through service files in `src/services`
- NestJS processes requests and persists data in MySQL through TypeORM
- Redis stores cache entries for fast reads
- Kafka carries async social events such as follow, like, and comment activity
- Socket.IO pushes realtime updates to connected clients

## 4. Purpose Of Each File

### 4.1 Root files

- `README.md`: top-level entry note for the repository
- `document.md`: this project report and module status document

### 4.2 `Evolix/` files

#### Configuration and project files

- `Evolix/index.html`: HTML shell and React mount target
- `Evolix/package.json`: frontend scripts and dependencies
- `Evolix/package-lock.json`: locked package versions for the frontend
- `Evolix/tsconfig.json`: TypeScript configuration for the frontend
- `Evolix/vite.config.ts`: Vite config, alias setup, proxy rules, and build settings
- `Evolix/.env.example`: example environment variable definitions
- `Evolix/metadata.json`: AI Studio metadata file
- `Evolix/README.md`: frontend-specific readme
- `Evolix/TONG_HOP_CHUC_NANG_WEB.md`: summary of web features
- `Evolix/WORK_LOG_AUTH_BACKEND.md`: work log for auth backend implementation
- `Evolix/.gitignore`: ignored files list

#### Legacy Express backend in `Evolix/server/`

- `Evolix/server/index.ts`: Express auth API bootstrap and server startup
- `Evolix/server/auth.ts`: auth service, password hashing, JWT creation, and validation helpers
- `Evolix/server/userRepository.ts`: user repository with in-memory and MySQL-backed implementations

#### Database script

- `Evolix/mysql/init.sql`: SQL schema used by the legacy auth backend

#### Frontend bootstrap and shared code

- `Evolix/src/main.tsx`: React application entry point
- `Evolix/src/App.tsx`: route map and top-level application composition
- `Evolix/src/index.css`: global styling, theme variables, and reusable utility classes
- `Evolix/src/contexts/ThemeContext.tsx`: display preferences, chat theme, nickname, and CSS variable syncing
- `Evolix/src/services/apiConfig.ts`: shared base URL and API path helper
- `Evolix/src/services/authApi.ts`: auth API client and session storage helper
- `Evolix/src/services/usersApi.ts`: user search API helper
- `Evolix/src/services/tweetsApi.ts`: tweet API helper
- `Evolix/src/services/commentsApi.ts`: comment API helper
- `Evolix/src/services/followsApi.ts`: follow API helper
- `Evolix/src/services/likesApi.ts`: like API helper
- `Evolix/src/services/notificationsApi.ts`: notification API helper
- `Evolix/src/services/bookmarksApi.ts`: bookmark API helper
- `Evolix/src/services/realtimeClient.ts`: Socket.IO client factory
- `Evolix/src/services/messagesApi.ts`: direct messages API helper

#### Components

- `Evolix/src/components/Layout.tsx`: sidebar shell, navigation, and page layout wrapper
- `Evolix/src/components/Tweet.tsx`: tweet card UI and post action handling
- `Evolix/src/components/TrendingSidebar.tsx`: discovery sidebar with search and trends

#### Pages

- `Evolix/src/pages/Home.tsx`: home timeline and composer page
- `Evolix/src/pages/Explore.tsx`: search and discovery page
- `Evolix/src/pages/Notifications.tsx`: notifications list page
- `Evolix/src/pages/Follow.tsx`: follow suggestion page
- `Evolix/src/pages/Bookmarks.tsx`: saved posts page
- `Evolix/src/pages/Post.tsx`: dedicated create-post page
- `Evolix/src/pages/TweetDetail.tsx`: tweet detail, replies, and interaction page
- `Evolix/src/pages/Profile.tsx`: profile page with posts, replies, and follow actions
- `Evolix/src/pages/Messages.tsx`: route wrapper for the inbox experience
- `Evolix/src/pages/MessagesEnhanced.tsx`: backend-backed direct message inbox
- `Evolix/src/pages/Settings.tsx`: settings hub page
- `Evolix/src/pages/AccountInformation.tsx`: account information view
- `Evolix/src/pages/ChangePassword.tsx`: password change page
- `Evolix/src/pages/DeactivateAccount.tsx`: account deactivation page
- `Evolix/src/pages/DirectMessages.tsx`: direct message privacy settings page
- `Evolix/src/pages/PushNotifications.tsx`: push notification preferences page
- `Evolix/src/pages/EmailNotifications.tsx`: email notification preferences page
- `Evolix/src/pages/Login.tsx`: login form page
- `Evolix/src/pages/Register.tsx`: registration form page
- `Evolix/src/pages/ForgotPassword.tsx`: forgot password page
- `Evolix/src/pages/AddAccount.tsx`: add account page
- `Evolix/src/pages/Logout.tsx`: logout confirmation page

### 4.3 `Evolix_backend/` files

#### Configuration and project files

- `Evolix_backend/package.json`: NestJS scripts and backend dependencies
- `Evolix_backend/package-lock.json`: locked backend dependency versions
- `Evolix_backend/docker-compose.yml`: local MySQL, Redis, Kafka, Zookeeper, and phpMyAdmin services
- `Evolix_backend/tsconfig.json`: TypeScript config for the backend
- `Evolix_backend/tsconfig.build.json`: build-specific TypeScript config
- `Evolix_backend/eslint.config.mjs`: lint configuration
- `Evolix_backend/nest-cli.json`: Nest CLI configuration
- `Evolix_backend/.prettierrc`: code formatting configuration
- `Evolix_backend/.gitignore`: ignored files list
- `Evolix_backend/README.md`: default NestJS readme

#### Backend bootstrap and core

- `Evolix_backend/src/main.ts`: Nest bootstrap and Kafka microservice wiring
- `Evolix_backend/src/app.module.ts`: root module that imports all feature modules and infrastructure modules
- `Evolix_backend/src/app.controller.ts`: root controller for the application
- `Evolix_backend/src/app.service.ts`: root service for the application

#### Auth

- `Evolix_backend/src/auth/auth.module.ts`: auth module wiring
- `Evolix_backend/src/auth/auth.controller.ts`: auth endpoints
- `Evolix_backend/src/auth/auth.service.ts`: auth logic for register, login, and token generation
- `Evolix_backend/src/auth/auth.guard.ts`: JWT guard for protected routes
- `Evolix_backend/src/auth/auth.controller.spec.ts`: auth controller test scaffold
- `Evolix_backend/src/auth/auth.service.spec.ts`: auth service test scaffold

#### Users

- `Evolix_backend/src/users/users.module.ts`: users module wiring
- `Evolix_backend/src/users/users.controller.ts`: user lookup and search endpoints
- `Evolix_backend/src/users/users.service.ts`: user lookup and search logic
- `Evolix_backend/src/users/entities/user.entity.ts`: user entity definition
- `Evolix_backend/src/users/users.controller.spec.ts`: users controller test scaffold
- `Evolix_backend/src/users/users.service.spec.ts`: users service test scaffold

#### Tweets

- `Evolix_backend/src/tweets/tweets.module.ts`: tweets module wiring
- `Evolix_backend/src/tweets/tweets.controller.ts`: tweet endpoints
- `Evolix_backend/src/tweets/tweets.service.ts`: tweet creation, retweet, and timeline logic
- `Evolix_backend/src/tweets/entities/tweet.entity.ts`: tweet entity definition
- `Evolix_backend/src/tweets/tweets.controller.spec.ts`: tweets controller test scaffold
- `Evolix_backend/src/tweets/tweets.service.spec.ts`: tweets service test scaffold

#### Follows

- `Evolix_backend/src/follows/follows.module.ts`: follows module wiring
- `Evolix_backend/src/follows/follows.controller.ts`: follow endpoints and Kafka event handling
- `Evolix_backend/src/follows/follows.service.ts`: follow and unfollow logic
- `Evolix_backend/src/follows/entities/follow.entity.ts`: follow entity definition
- `Evolix_backend/src/follows/follows.controller.spec.ts`: follows controller test scaffold
- `Evolix_backend/src/follows/follows.service.spec.ts`: follows service test scaffold

#### Likes

- `Evolix_backend/src/likes/likes.module.ts`: likes module wiring
- `Evolix_backend/src/likes/likes.controller.ts`: like endpoints and Kafka event handling
- `Evolix_backend/src/likes/likes.service.ts`: like and unlike logic
- `Evolix_backend/src/likes/entities/like.entity.ts`: like entity definition
- `Evolix_backend/src/likes/likes.controller.spec.ts`: likes controller test scaffold
- `Evolix_backend/src/likes/likes.service.spec.ts`: likes service test scaffold

#### Comments

- `Evolix_backend/src/comments/comments.module.ts`: comments module wiring
- `Evolix_backend/src/comments/comments.controller.ts`: comment endpoints and Kafka event handling
- `Evolix_backend/src/comments/comments.service.ts`: comment creation and reply logic
- `Evolix_backend/src/comments/entities/comment.entity.ts`: comment entity definition
- `Evolix_backend/src/comments/comments.controller.spec.ts`: comments controller test scaffold
- `Evolix_backend/src/comments/comments.service.spec.ts`: comments service test scaffold

#### Notifications

- `Evolix_backend/src/notifications/notifications.module.ts`: notifications module wiring
- `Evolix_backend/src/notifications/notifications.controller.ts`: notification endpoints
- `Evolix_backend/src/notifications/notifications.service.ts`: notification creation and list logic
- `Evolix_backend/src/notifications/entities/notification.entity.ts`: notification entity definition

#### Bookmarks

- `Evolix_backend/src/bookmarks/bookmarks.module.ts`: bookmarks module wiring
- `Evolix_backend/src/bookmarks/bookmarks.controller.ts`: bookmark endpoints
- `Evolix_backend/src/bookmarks/bookmarks.service.ts`: bookmark creation and list logic
- `Evolix_backend/src/bookmarks/entities/bookmark.entity.ts`: bookmark entity definition

#### Realtime

- `Evolix_backend/src/realtime/realtime.module.ts`: realtime module wiring
- `Evolix_backend/src/realtime/realtime.gateway.ts`: Socket.IO gateway and user-targeted emits
- `Evolix_backend/src/realtime/realtime.controller.ts`: test controller for realtime events

#### Kafka

- `Evolix_backend/src/kafka/kafka.module.ts`: Kafka client module

#### Direct messages

- `Evolix_backend/src/messages/messages.module.ts`: direct message module wiring
- `Evolix_backend/src/messages/messages.controller.ts`: DM API endpoints
- `Evolix_backend/src/messages/messages.service.ts`: conversation and message handling logic
- `Evolix_backend/src/messages/entities/direct-message-conversation.entity.ts`: conversation entity
- `Evolix_backend/src/messages/entities/direct-message-participant.entity.ts`: participant relation entity
- `Evolix_backend/src/messages/entities/direct-message.entity.ts`: message entity

#### Backend tests

- `Evolix_backend/test/app.e2e-spec.ts`: root e2e test scaffold
- `Evolix_backend/test/jest-e2e.json`: Jest e2e configuration

### 4.4 `Evolix_backend2/`

- This directory is empty.

## 5. Finished Modules

### 5.1 Backend modules that are finished

- Authentication
- User search and lookup
- User profile management
- Account deactivation support
- Tweet creation, retweet, tweet detail support, and feed support
- Follows
- Likes
- Comments
- Notifications
- Bookmarks
- Realtime Socket.IO gateway
- Direct messages backend module

### 5.2 Frontend modules and pages that are finished

- Login and register flows
- Home timeline UI wiring
- Tweet detail page wiring
- Explore search wiring
- Notifications page wiring
- Bookmarks page wiring
- Profile page wiring
- Messages inbox wiring
- Account information page wiring
- Change password page wiring
- Deactivate account page wiring
- Theme and preference persistence

- `Who to follow` suggestions: TrendingSidebar now fetches backend suggestions (`GET /users/suggestions`).
 - `Trending topics`: `Explore.tsx` now fetches trending topics from `GET /tweets/trending` and renders them instead of static placeholders.
 - `Lead story`: `Explore.tsx` now fetches a lead story from `GET /tweets/lead` (prefers recent tweets with media, falls back to a default) and renders it.
 - `Trending cache`: backend `TweetsService.getTrendingTopics()` now caches results for 5 minutes to reduce DB load; lead story is cached briefly (60s).

The frontend mock-data sweep is complete; remaining frontend work is now focused on performance and maintenance.

## 6. Not Finished Modules

### 6.1 Backend modules still missing or incomplete

- Benchmark and load testing for 10k users

DTO validation and stronger request contract enforcement are now in place for the main write paths: auth register/login/password changes, tweet creation, and profile updates. The Nest bootstrap now enables a global validation pipe with whitelist and transformation.

Feed endpoints now support pagination through `limit` and `offset`, and the `for-you` feed applies a lightweight ranking heuristic based on recency and engagement.

The write-path cache invalidation gap has been addressed for tweet creation and retweets: timeline caches are invalidated, and discovery caches (`trending_topics`, `lead_story`) are cleared when tweet writes can affect them.

Backend test coverage is now expanded beyond the original scaffolds with real service and controller tests for auth, users, and tweets.

## 7. Short Conclusion

The project now has a defined stack and a mostly complete core social backend. The remaining work is mainly validation and security cleanup, benchmark/performance evaluation, and backend hardening.
