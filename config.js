const config = {
    local: {
        port: 5432,
        db: {
            host: 'localhost',
            port: 27017,
            name: 'sprint-retrospective',
            username: 'root',
            password: 'root'
        }
    },
    production:
        {
            port: 5432,
            db: {
                host: 'localhost',
                port: 27017,
                name: 'sprint-retrospective'
            }
        }
};

module.exports = (mode) => {
    return config[mode || process.argv[2] || 'local'] || config.local;
};
