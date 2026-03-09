const mongoose = require('mongoose');
const { getAuditInfo } = require('../middleware/auditContext');

const auditPlugin = function (schema, options) {
    // Add audit fields to the schema
    schema.add({
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        addedDate: { type: Date, default: null },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        modifiedDate: { type: Date, default: null }
    });

    // Helper to create log entry
    const createAuditRecord = async (doc, actionType, details = null) => {
        try {
            const AuditLog = mongoose.model('AuditLog');
            const info = getAuditInfo() || (doc && doc._auditInfo ? doc._auditInfo : null);
            if (!info) return;

            const modelName = doc.constructor.modelName || 'Unknown';
            const resourceId = doc.orderId || doc.name || doc._id;

            await AuditLog.create({
                user: info.email || 'System',
                userId: info.userId,
                role: info.role || 'System',
                brandId: info.brandId,
                outletId: info.outletId,
                action: `${actionType} ${modelName}`,
                resource: `${modelName} ${resourceId}`,
                status: 'Success',
                details: details,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('[AuditPlugin] Failed to create log:', err.message);
        }
    };

    // Pre-save hook (for doc.save() and create())
    schema.pre('save', async function () {
        try {
            const info = getAuditInfo();
            const userId = (info && info.userId) ? info.userId : null;
            const now = new Date();

            if (this.isNew) {
                this.addedBy = userId;
                this.addedDate = now;
                this.modifiedBy = userId;
                this.modifiedDate = now;
                this._isNewFlag = true;
            } else {
                this.modifiedBy = userId;
                this.modifiedDate = now;
                this._isUpdateFlag = true;

                // Capture diff
                const diff = {};
                this.modifiedPaths().forEach(path => {
                    if (['modifiedBy', 'modifiedDate'].includes(path)) return;
                    diff[path] = this.get(path);
                });
                this._auditDiff = diff;
            }
            // Attach info to document for post-save hook
            if (info) this._auditInfo = info;
        } catch (err) {
            console.error('[AuditPlugin] Pre-save error:', err);
        }
    });

    schema.post('save', async function (doc) {
        const action = doc._isNewFlag ? 'Create' : 'Update';
        await createAuditRecord(doc, action, doc._auditDiff);
    });

    // Update payload modifier for findOneAndUpdate, updateOne
    const updateHook = async function () {
        const update = this.getUpdate();
        if (!update) return;

        const info = getAuditInfo();
        const userId = info ? info.userId : null;
        const now = new Date();

        if (!update.$set) update.$set = {};
        update.$set.modifiedBy = userId;
        update.$set.modifiedDate = now;

        // Capture changes for logs
        const changes = { ...(update.$set || {}), ...(update.$push || {}), ...(update.$pull || {}) };
        const diff = {};
        Object.keys(changes).forEach(key => {
            if (['modifiedBy', 'modifiedDate'].includes(key)) return;
            diff[key] = changes[key];
        });
        this._auditDiff = diff;
        if (info) this._auditInfo = info;
    };

    schema.post('findOneAndUpdate', async function (doc) {
        if (doc) {
            // Attach stored info and diff from query to doc if not present
            if (this._auditInfo) doc._auditInfo = this._auditInfo;
            await createAuditRecord(doc, 'Update', this._auditDiff);
        }
    });

    schema.pre('findOneAndUpdate', updateHook);
    schema.pre('updateOne', updateHook);
};

module.exports = auditPlugin;
