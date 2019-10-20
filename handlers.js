export default app => {
    app.post('/:id/good', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        getData(req.params.id).good.push({text: req.body.text, id: uuid(), up: 0, down: 0});
        return res.status(201).send();
    });
    app.post('/:id/good/:action_id/up', (req, res) => {
        getData(req.params.id).good.filter(({id}) => id === req.params.action_id)[0].up++;
        return res.status(201).send();
    });
    app.post('/:id/good/:action_id/down', (req, res) => {
        getData(req.params.id).good.filter(({id}) => id === req.params.action_id)[0].down++;
        return res.status(201).send();
    });
    app.post('/:id/bad', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        getData(req.params.id).bad.push({text: req.body.text, id: uuid(), up: 0, down: 0});
        return res.status(201).send();
    });
    app.post('/:id/bad/:action_id/up', (req, res) => {
        getData(req.params.id).bad.filter(({id}) => id === req.params.action_id)[0].up++;
        return res.status(201).send();
    });
    app.post('/:id/bad/:action_id/down', (req, res) => {
        getData(req.params.id).bad.filter(({id}) => id === req.params.action_id)[0].down++;
        return res.status(201).send();
    });
    app.post('/:id/action', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        getData(req.params.id).actions.push({text: req.body.text, id: uuid(), up: 0, down: 0});
        return res.status(201).send();
    });
    app.post('/:id/action/:action_id/up', (req, res) => {
        getData(req.params.id).actions.filter(({id}) => id === req.params.action_id)[0].up++;
        return res.status(201).send();
    });
    app.post('/:id/action/:action_id/down', (req, res) => {
        getData(req.params.id).actions.filter(({id}) => id === req.params.action_id)[0].down++;
        return res.status(201).send();
    });
    app.put('/:id/title', (req, res) => {
        validate(req.body, {
            title: ['required', 'minlength:1', `maxlength:${TITLE_MAX_LENGTH}`]
        });

        getData(req.params.id).title = req.body.title;
        return res.status(200).send();
    });
    app.get('/:id/', (req, res) => {
        return res.status(200).send(getData(req.params.id));
    });
};
