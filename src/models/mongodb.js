const mongoose = require('mongoose');
const items = require("./items_model");

mongoose.set('debug', true);

const connection = () => {
    return new Promise((resolve, reject) => {
	    mongoose.set('strictQuery',false);
	    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
            if (err) resolve(false);
            resolve(true);
        });
    });
}

module.exports = {
    connection: connection,
    ObjectId: mongoose.Types.ObjectId,
    items: items,
}
