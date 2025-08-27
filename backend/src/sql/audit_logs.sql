CREATE TABLE audit_logs (
id BIGINT PK
user_id INT
username VARCHAR(255)
action ENUM('CREATE','UPDATE','DELETE')
entity_type VARCHAR(64)        -- 'ibaan','tax_forms','landparcel',...
entity_id VARCHAR(64)          -- ParcelId, parcelID, tax_forms.id, etc.
entity_ctx JSON                -- { ParcelId, LotNumber, BarangayNa, arpNo, taxId, ... } small, human-readable
changed_fields JSON            -- ["LotNumber","BarangayNa","geometry"]
before_data JSON               -- minimal snapshot (omit full geometry)
after_data JSON
ip VARCHAR(45) NULL
user_agent VARCHAR(255) NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
INDEX(entity_type, entity_id, created_at),
INDEX(username, created_at),
INDEX(created_at)
)