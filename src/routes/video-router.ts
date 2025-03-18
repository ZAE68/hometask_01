import express, { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { error } from 'console';

export const videoRouter = Router({});
type Resolution =
    | 'P144'
    | 'P240'
    | 'P360'
    | 'P480'
    | 'P720'
    | 'P1080'
    | 'P1440'
    | 'P2160';

const allowedResolutions: Resolution[] = [
    'P144',
    'P240',
    'P360',
    'P480',
    'P720',
    'P1080',
    'P1440',
    'P2160',
];
videoRouter.use(bodyParser.json());
type VideoType = {
    id: number;
    title: string;
    author: string;
    canBeDownloaded: boolean;
    minAgeRestriction: number | null;
    createdAt: string;
    publicationDate: string;
    availableResolutions: Resolution[];
};

type ValidationRule = {
    field: string;
    check: (body: any) => boolean;
    message: string;
};
const videos: VideoType[] = [];

videoRouter.get('/', (req: Request, res: Response) => {
    res.status(200).send(videos);
});

videoRouter.get('/:id', (req: Request, res: Response) => {
    req.params.id;
    let video = videos.find((v) => v.id === +req.params.id);
    if (video) {
        res.status(200).send(video);
    } else {
        res.sendStatus(404);
    }
});

videoRouter.delete('/:id', (req: Request, res: Response) => {
    for (let i = 0; i < videos.length; i++) {
        if (videos[i].id === +req.params.id) {
            videos.splice(i, 1);
            res.sendStatus(204);
            return;
        }
    }
    res.sendStatus(404);
});

videoRouter.delete('/', (req: Request, res: Response) => {
    try {
        videos.splice(0, videos.length);
        res.sendStatus(204);
    } catch (error) {
        console.error('Error clearing videos', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to clear video list',
        });
    }
});

videoRouter.post('/', (req: Request, res: Response) => {
    const errors: Array<{ message: string; field: string }> = [];

    const validationRules = [
        {
            field: 'title',
            check: (b: any) =>
                typeof b.title === 'string' &&
                b.title.trim().length > 0 &&
                b.title.length <= 40,
            message: 'Title must be 1-40 characters',
        },
        {
            field: 'author',
            check: (b: any) =>
                typeof b.author === 'string' &&
                b.author.trim().length > 0 &&
                b.author.length <= 20,
            message: 'Author must be 1-20 characters',
        },
        {
            field: 'availableResolutions',
            check: (b: any) => {
                if (!b.availableResolutions) return true; // Разрешаем отсутствие поля
                return (
                    Array.isArray(b.availableResolutions) &&
                    b.availableResolutions.every((r: string) =>
                        [
                            'P144',
                            'P240',
                            'P360',
                            'P480',
                            'P720',
                            'P1080',
                            'P1440',
                            'P2160',
                        ].includes(r)
                    )
                );
            },
            message: 'Invalid resolutions',
        },
    ];

    validationRules.forEach((rule) => {
        if (!rule.check(req.body)) {
            errors.push({
                message: rule.message,
                field: rule.field,
            });
        }
    });

    if (errors.length > 0) {
        res.status(400).json({
            errorsMessages: errors,
        });
        return;
    }

    try {
        function getNextId() {
            return videos.length ? Math.max(...videos.map((v) => v.id)) + 1 : 1;
        }

        const newVideo: VideoType = {
            id: getNextId(),
            title: req.body.title,
            author: req.body.author,
            availableResolutions: req.body.availableResolutions as Resolution[],
            canBeDownloaded: true,
            minAgeRestriction: null,
            createdAt: new Date().toISOString(),
            publicationDate: new Date().toISOString(),
        };
        videos.push(newVideo);
        res.status(201).send(newVideo);
        return;
    } catch (error) {
        console.error('Error creating video:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create video',
        });
        return;
    }
});

videoRouter.put('/:id', (req: Request, res: Response) => {
    const errors: Array<{ message: string; field: string }> = [];
    const body = req.body;
    let video = videos.find((v) => v.id === +req.params.id);

    const validationRules: ValidationRule[] = [
        {
            field: 'title',
            check: (b) => b.title?.trim().length > 0 && b.title.length <= 40,
            message: 'Title must be 1-40 characters',
        },
        {
            field: 'author',
            check: (b) => b.author?.trim().length > 0 && b.author.length <= 20,
            message: 'Author must be 1-20 characters',
        },
        {
            field: 'availableResolutions',
            check: (b) =>
                Array.isArray(b.availableResolutions) &&
                b.availableResolutions.every((r: string) =>
                    [
                        'P144',
                        'P240',
                        'P360',
                        'P480',
                        'P720',
                        'P1080',
                        'P1440',
                        'P2160',
                    ].includes(r)
                ),
            message: 'Invalid resolutions',
        },
        {
            field: 'minAgeRestriction',
            check: (b) =>
                b.minAgeRestriction === null ||
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
    } else if (body.canBeDownloaded && pubDate > new Date()) {
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
    } else {
        res.send(404);
    }
});
