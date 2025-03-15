"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoRouter = void 0;
const express_1 = require("express");
const body_parser_1 = __importDefault(require("body-parser"));
exports.videoRouter = (0, express_1.Router)({});
exports.videoRouter.use(body_parser_1.default.json());
const videos = [];
exports.videoRouter.get('/', (req, res) => {
    res.status(200).send(videos);
});
exports.videoRouter.get('/:id', (req, res) => {
    req.params.id;
    let video = videos.find((v) => v.id === +req.params.id);
    if (video) {
        res.status(200).send(video);
    }
    else {
        res.sendStatus(404);
    }
});
exports.videoRouter.delete('/:id', (req, res) => {
    for (let i = 0; i < videos.length; i++) {
        if (videos[i].id === +req.params.id) {
            videos.splice(i, 1);
            res.sendStatus(204);
            return;
        }
    }
    res.sendStatus(404);
});
exports.videoRouter.post('/', (req, res) => {
    function getNextId() {
        if (videos.length === 0)
            return 1;
        return Math.max(...videos.map((video) => video.id)) + 1;
    }
    const newVideo = {
        id: getNextId(),
        title: req.body.title,
        author: req.body.author,
        availableResolutions: ['P144'],
        canBeDownloaded: true,
        minAgeRestriction: null,
        createdAt: new Date().toISOString(),
        publicationDate: new Date().toISOString(),
    };
    videos.push(newVideo);
    res.status(201).send(newVideo);
    return;
});
exports.videoRouter.put('/:id', (req, res) => {
    const errors = [];
    const body = req.body;
    let video = videos.find((v) => v.id === +req.params.id);
    const validationRules = [
        {
            field: 'title',
            check: (b) => { var _a; return ((_a = b.title) === null || _a === void 0 ? void 0 : _a.trim().length) > 0 && b.title.length <= 40; },
            message: 'Title must be 1-40 characters',
        },
        {
            field: 'author',
            check: (b) => { var _a; return ((_a = b.author) === null || _a === void 0 ? void 0 : _a.trim().length) > 0 && b.author.length <= 20; },
            message: 'Author must be 1-20 characters',
        },
        {
            field: 'availableResolutions',
            check: (b) => Array.isArray(b.availableResolutions) &&
                b.availableResolutions.every((r) => [
                    'P144',
                    'P240',
                    'P360',
                    'P480',
                    'P720',
                    'P1080',
                    'P1440',
                    'P2160',
                ].includes(r)),
            message: 'Invalid resolutions',
        },
        {
            field: 'minAgeRestriction',
            check: (b) => b.minAgeRestriction === null ||
                (Number.isInteger(b.minAgeRestriction) &&
                    b.minAgeRestriction >= 1 &&
                    b.minAgeRestriction <= 18),
            message: 'Age restriction must be 1-18 or null',
        },
    ];
    validationRules.forEach((rule) => {
        if (!rule.check(body)) {
            errors.push({ field: rule.field, message: rule.message });
        }
    });
    const pubDate = new Date(body.publicationDate);
    if (isNaN(pubDate.getTime())) {
        errors.push({
            field: 'publicationDate',
            message: 'Invalid date format',
        });
    }
    else if (body.canBeDownloaded && pubDate > new Date()) {
        errors.push({
            field: 'publicationDate',
            message: 'Publication date must be in past when downloadable',
        });
    }
    if (errors.length) {
        res.status(400).send({ errorsMessages: errors });
    }
    if (video) {
        (video.title = req.body.title), (video.author = req.body.author);
        video.availableResolutions = req.body.availableResolutions;
        video.canBeDownloaded = req.body.canBeDownloaded;
        video.minAgeRestriction = req.body.minAgeRestriction;
        video.publicationDate = req.body.publicationDate;
        res.send(204);
    }
    else {
        res.send(404);
    }
});
