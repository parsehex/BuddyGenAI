const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    }
  }
}

module.exports = config
