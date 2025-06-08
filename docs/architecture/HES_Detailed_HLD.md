# HES System - High-Level Design Document

## System Overview Diagram
```mermaid
graph TB
    subgraph "Field Layer"
        SM1[Smart Meter 1]
        SM2[Smart Meter 2]
        SM3[Smart Meter n]
    end

    subgraph "Communication Layer"
        DLMS[DLMS/COSEM Gateway]
        TCP[TCP/IP Network]
    end

    subgraph "Collection Layer"
        LB[Load Balancer]
        DC1[Data Collector 1]
        DC2[Data Collector 2]
        DC3[Data Collector n]
    end

    subgraph "Processing Layer"
        KF1[Kafka Cluster]
        FL1[Flink Processing]
        SP1[Stream Processing]
    end

    subgraph "Storage Layer"
        TS[TimescaleDB]
        RC[Redis Cache]
        DW[Data Warehouse]
    end

    subgraph "Application Layer"
        API[REST API]
        WS[WebSocket Server]
        BL[Business Logic]
    end

    subgraph "Presentation Layer"
        WEB[Web Interface]
        MOB[Mobile App]
        EXT[External Systems]
    end

    SM1 & SM2 & SM3 --> DLMS
    DLMS --> TCP
    TCP --> LB
    LB --> DC1 & DC2 & DC3
    DC1 & DC2 & DC3 --> KF1
    KF1 --> FL1
    FL1 --> SP1
    SP1 --> TS & RC
    TS & RC --> DW
    TS & RC & DW --> API & WS
    API & WS --> BL
    BL --> WEB & MOB & EXT
```

## Detailed Data Flow
```mermaid
sequenceDiagram
    participant SM as Smart Meter
    participant DC as Data Collector
    participant KF as Kafka
    participant FL as Flink
    participant DB as Database
    participant API as API Server
    participant UI as User Interface

    SM->>DC: Send Meter Reading
    DC->>DC: Validate Reading
    DC->>KF: Publish to Topic
    KF->>FL: Stream Processing
    FL->>FL: Data Aggregation
    FL->>DB: Store Processed Data
    DB->>API: Query Results
    API->>UI: Update Dashboard
```

## DLMS/COSEM Protocol Stack
```mermaid
graph TB
    subgraph "DLMS/COSEM Stack"
        direction TB
        APP[Application Layer]
        XDLMS[xDLMS ASE]
        ACSE[ACSE]
        LLC[LLC]
        MAC[MAC]
        PHY[Physical Layer]
    end

    subgraph "Security Services"
        direction TB
        AUTH[Authentication]
        ENC[Encryption]
        ACC[Access Control]
    end

    subgraph "Data Model"
        direction TB
        OBJ[COSEM Objects]
        ATTR[Attributes]
        METH[Methods]
    end

    PHY --> MAC
    MAC --> LLC
    LLC --> ACSE
    ACSE --> XDLMS
    XDLMS --> APP
    APP --> AUTH
    APP --> ENC
    APP --> ACC
    AUTH & ENC & ACC --> OBJ
    OBJ --> ATTR
    OBJ --> METH
```

## Real-time Processing Pipeline
```mermaid
graph LR
    subgraph "Data Ingestion"
        I1[Collector 1]
        I2[Collector 2]
        I3[Collector n]
    end

    subgraph "Message Queue"
        Q1[Raw Data Topic]
        Q2[Validated Topic]
        Q3[Processed Topic]
    end

    subgraph "Stream Processing"
        S1[Validation]
        S2[Transformation]
        S3[Aggregation]
    end

    subgraph "Storage"
        D1[Real-time Data]
        D2[Historical Data]
        D3[Analytics Data]
    end

    I1 & I2 & I3 --> Q1
    Q1 --> S1
    S1 --> Q2
    Q2 --> S2
    S2 --> Q3
    Q3 --> S3
    S3 --> D1 & D2 & D3
```

## Security Architecture
```mermaid
graph TB
    subgraph "Security Layers"
        direction TB
        TLS[Transport Security]
        DLMS[DLMS Security]
        APP[Application Security]
        DATA[Data Security]
    end

    subgraph "Authentication"
        direction TB
        LK[Low Level Security]
        HK[High Level Security]
        CERT[Certificate Based]
    end

    subgraph "Authorization"
        direction TB
        RBAC[Role Based Access]
        ABAC[Attribute Based Access]
        TOKEN[Token Management]
    end

    TLS --> DLMS
    DLMS --> APP
    APP --> DATA
    LK & HK & CERT --> DLMS
    RBAC & ABAC & TOKEN --> APP
```

## Deployment Architecture
```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Zone 1"
            LB1[Load Balancer]
            APP1[Application Servers]
            DB1[Database Primary]
        end

        subgraph "Zone 2"
            LB2[Load Balancer]
            APP2[Application Servers]
            DB2[Database Replica]
        end

        subgraph "Zone 3"
            LB3[Load Balancer]
            APP3[Application Servers]
            DB3[Database Replica]
        end
    end

    subgraph "Monitoring"
        MON[Monitoring System]
        LOG[Log Aggregation]
        ALERT[Alert System]
    end

    Zone 1 <--> Zone 2
    Zone 2 <--> Zone 3
    Zone 1 & Zone 2 & Zone 3 --> MON
    MON --> LOG
    LOG --> ALERT
```

## Performance Metrics Flow
```mermaid
graph LR
    subgraph "Data Collection"
        M1[Meter Metrics]
        S1[System Metrics]
        P1[Performance Metrics]
    end

    subgraph "Processing"
        AGG[Aggregation]
        ANAL[Analysis]
        PRED[Prediction]
    end

    subgraph "Visualization"
        DASH[Dashboard]
        REPORT[Reports]
        ALERT[Alerts]
    end

    M1 & S1 & P1 --> AGG
    AGG --> ANAL
    ANAL --> PRED
    PRED --> DASH & REPORT & ALERT
```

## Disaster Recovery Flow
```mermaid
graph TB
    subgraph "Primary Site"
        P_APP[Application Servers]
        P_DB[Primary Database]
        P_CACHE[Primary Cache]
    end

    subgraph "DR Site"
        D_APP[Application Servers]
        D_DB[DR Database]
        D_CACHE[DR Cache]
    end

    subgraph "Failover Process"
        DETECT[Failure Detection]
        SWITCH[DNS Switch]
        SYNC[Data Sync]
    end

    P_APP --> P_DB
    P_DB --> P_CACHE
    DETECT --> SWITCH
    SWITCH --> D_APP
    D_APP --> D_DB
    D_DB --> D_CACHE
    P_DB --> SYNC
    SYNC --> D_DB
``` 