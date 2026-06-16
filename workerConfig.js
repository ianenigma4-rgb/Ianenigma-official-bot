// Injected by master index.js before forking
// worker.js reads this to know which session slot it owns
module.exports = {
    sessionIndex: parseInt(process.env.WORKER_SESSION_INDEX || '1', 10)
}
