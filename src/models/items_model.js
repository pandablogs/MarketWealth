const mongoose = require('mongoose');
const itemsFactory = new mongoose.Schema({
    title: { type: String, required: true },
    uuid: { type: String, required: true },
    subtitle: { type: String, defualt: "" },
    contents: { type: Object, required: true },
    image: { type: String, default: "" },
    link: { type: String, default: "" },
    type: { type: String, default: "" },
    groupType: { type: String, default: "" },
    list_contents: { type: Object, default: "" },
    social_links: {
        type: Object,
        default: {
            "facebook": "",
            "twitter": "",
            "linkedin": "",
            "mail": "",
            "whatsapp": ""
        }
    },
    is_deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() },
    updatedAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model('items', itemsFactory);

