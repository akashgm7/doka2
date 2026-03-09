const { AsyncLocalStorage } = require('async_hooks');

const auditContext = new AsyncLocalStorage();

// Middleware to wrap request and inject user context
const auditMiddleware = (req, res, next) => {
    // The user identity should be added into this context via authMiddleware
    auditContext.run(new Map(), () => {
        next();
    });
};

const getAuditInfo = () => {
    const store = auditContext.getStore();
    return store ? store.get('auditInfo') : null;
};

const setAuditInfo = (info) => {
    const store = auditContext.getStore();
    if (store) {
        store.set('auditInfo', info);
    }
};

module.exports = {
    auditContext,
    auditMiddleware,
    getAuditInfo,
    setAuditInfo
};
