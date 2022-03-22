const config={
    production :{
        SECRET: process.env.SECRET,
        DATABASE: process.env.MONGODB_URI
    },
    default : {
        SECRET: 'secretkey',
        DATABASE: 'mongodb://localhost:27017/nodeUser'
    }
}

exports.get = function get(env){
     return config[env] || config.default
}