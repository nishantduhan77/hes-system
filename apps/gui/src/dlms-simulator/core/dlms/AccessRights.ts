export class AccessRights {
    constructor(
        public readonly read: boolean,
        public readonly write: boolean,
        public readonly execute: boolean,
        public readonly authenticate: boolean
    ) {}

    public static readonly NONE = new AccessRights(false, false, false, false);
    public static readonly READ_ONLY = new AccessRights(true, false, false, false);
    public static readonly WRITE_ONLY = new AccessRights(false, true, false, false);
    public static readonly EXECUTE_ONLY = new AccessRights(false, false, true, false);
    public static readonly AUTHENTICATE_ONLY = new AccessRights(false, false, false, true);
    public static readonly FULL = new AccessRights(true, true, true, true);

    public hasReadAccess(): boolean {
        return this.read;
    }

    public hasWriteAccess(): boolean {
        return this.write;
    }

    public hasExecuteAccess(): boolean {
        return this.execute;
    }

    public hasAuthenticateAccess(): boolean {
        return this.authenticate;
    }

    public equals(other: AccessRights): boolean {
        return this.read === other.read &&
               this.write === other.write &&
               this.execute === other.execute &&
               this.authenticate === other.authenticate;
    }

    public toJSON(): any {
        return {
            read: this.read,
            write: this.write,
            execute: this.execute,
            authenticate: this.authenticate
        };
    }

    public static fromJSON(json: any): AccessRights {
        return new AccessRights(
            json.read || false,
            json.write || false,
            json.execute || false,
            json.authenticate || false
        );
    }
} 