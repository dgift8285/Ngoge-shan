process.on('uncaughtException', (err) => {
  if (
    err.message.includes('ExperimentalWarning') ||
    err.message.includes('fetch')
  ) return;
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});