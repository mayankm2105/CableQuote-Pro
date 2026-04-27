module.exports = {
  getDatabaseUrl: () => {
    return process.env.DATABASE_URL || 'postgresql://localhost:5432/cablequote';
  }
};
