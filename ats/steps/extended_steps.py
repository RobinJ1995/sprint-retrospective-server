import json
import time
import uuid

import requests
from behave import given, when, then

BASE_URL = "http://localhost:5432"
ADMIN_KEY = "c74c12d6-7842-4fee-b476-47f4cf3f6526"

TEXT_MAX_LENGTH = 1024
TITLE_MAX_LENGTH = 128


def json_key(section):
    return 'actions' if section == 'action' else section


def fetch_retro(context, retro_id=None, headers=None):
    retro_id = retro_id or context.retro_id
    headers = headers if headers is not None else context.headers
    response = requests.get(f"{BASE_URL}/{retro_id}/", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def items_of(retro, section):
    return retro.get(json_key(section), [])


def find_item(retro, section, text):
    return next((item for item in items_of(retro, section) if item['text'] == text), None)


def require_item(retro, section, text):
    item = find_item(retro, section, text)
    assert item is not None, f"Item '{text}' not found in section '{section}'"
    return item


def new_retrospective():
    retro_id = str(uuid.uuid4())
    response = requests.post(f"{BASE_URL}/{retro_id}/authenticate")
    assert response.status_code == 200, response.text
    return retro_id, {'x-token': response.json()['token']}


def literal(value):
    """Turn a Gherkin literal such as "null", "42" or "text" into a Python value."""
    try:
        return json.loads(value)
    except ValueError:
        return value


def sized_text(context, description):
    """Resolve a text description such as 'of maximum length' into an actual string."""
    if description == 'of maximum length':
        return 'x' * TEXT_MAX_LENGTH
    if description == 'exceeding the maximum length':
        return 'x' * (TEXT_MAX_LENGTH + 1)
    if description == 'that is empty':
        return ''
    raise NotImplementedError(description)


# ---------------------------------------------------------------------------
# Retrospective lifecycle
# ---------------------------------------------------------------------------

@given('I have a second retrospective')
def step_impl(context):
    context.retro_id_2, context.headers_2 = new_retrospective()


def authenticate(retro_id):
    response = requests.post(f"{BASE_URL}/{retro_id}/authenticate")
    assert response.status_code == 200, response.text
    return {'x-token': response.json()['token']}


# The frontend builds a retrospective id as a uuid, a dash and a slug derived
# from the title. The uuid keeps every scenario addressing its own
# retrospective, so the suite stays re-runnable against a database that already
# holds data.
@given('I create a new retrospective with the id suffix "{suffix}"')
def step_impl(context, suffix):
    context.retro_id_base = str(uuid.uuid4())
    context.retro_id = f"{context.retro_id_base}-{suffix}"
    context.headers = authenticate(context.retro_id)


@given('I create a new retrospective with an id of {length:d} characters')
def step_impl(context, length):
    prefix = f"{uuid.uuid4()}-"
    context.retro_id = prefix + 'a' * (length - len(prefix))
    assert len(context.retro_id) == length
    context.headers = authenticate(context.retro_id)


# Shares the uuid of the retrospective created above, so that the two ids differ
# only in their suffix.
@given('I also have a retrospective with the id suffix "{suffix}"')
def step_impl(context, suffix):
    context.retro_id_2 = f"{context.retro_id_base}-{suffix}"
    context.headers_2 = authenticate(context.retro_id_2)


@then('the second retrospective should still be open')
def step_impl(context):
    response = requests.post(f"{BASE_URL}/{context.retro_id_2}/authenticate")
    assert response.status_code == 200, response.text


@when('I add a "{section}" item "{text}" to the second retrospective')
@given('I add a "{section}" item "{text}" to the second retrospective')
def step_impl(context, section, text):
    response = requests.post(
        f"{BASE_URL}/{context.retro_id_2}/{section}",
        json={'text': text},
        headers=context.headers_2)
    assert response.status_code == 201, response.text


@then('the second retrospective should contain "{section}" item "{text}"')
def step_impl(context, section, text):
    retro = fetch_retro(context, context.retro_id_2, context.headers_2)
    require_item(retro, section, text)


@then('the second retrospective should not contain "{section}" item "{text}"')
def step_impl(context, section, text):
    retro = fetch_retro(context, context.retro_id_2, context.headers_2)
    assert find_item(retro, section, text) is None


@then('the retrospective should have no "{section}" items')
def step_impl(context, section):
    retro = fetch_retro(context)
    assert items_of(retro, section) == [], items_of(retro, section)


@then('the retrospective should have {count:d} "{section}" items')
def step_impl(context, count, section):
    retro = fetch_retro(context)
    assert len(items_of(retro, section)) == count, items_of(retro, section)


@then('the retrospective should offer a websocket url')
def step_impl(context):
    retro = fetch_retro(context)
    socket = retro.get('socket')
    assert socket, retro
    assert socket.startswith('ws://'), socket


@then('the retrospective last update timestamp should be null')
def step_impl(context):
    retro = fetch_retro(context)
    assert retro.get('lastUpdate') is None, retro.get('lastUpdate')


@then('the retrospective last update timestamp should be set')
def step_impl(context):
    retro = fetch_retro(context)
    assert isinstance(retro.get('lastUpdate'), int), retro.get('lastUpdate')


@given('I remember the last update timestamp')
@when('I remember the last update timestamp')
def step_impl(context):
    context.remembered_last_update = fetch_retro(context).get('lastUpdate')


@then('the last update timestamp should have advanced')
def step_impl(context):
    current = fetch_retro(context).get('lastUpdate')
    assert current is not None
    assert context.remembered_last_update is None or current >= context.remembered_last_update, \
        f"{current} < {context.remembered_last_update}"


@then('the retrospective should expose an identifier')
def step_impl(context):
    retro = fetch_retro(context)
    assert retro.get('id') == context.retro_id, retro.get('id')


# ---------------------------------------------------------------------------
# Items
# ---------------------------------------------------------------------------

@when('I add the following "{section}" items')
def step_impl(context, section):
    context.table_texts = [row['text'] for row in context.table]
    for text in context.table_texts:
        response = requests.post(
            f"{BASE_URL}/{context.retro_id}/{section}",
            json={'text': text},
            headers=context.headers)
        assert response.status_code == 201, f"{text!r} -> {response.status_code} {response.text}"


@then('the "{section}" section should contain exactly those items')
def step_impl(context, section):
    retro = fetch_retro(context)
    texts = [item['text'] for item in items_of(retro, section)]
    assert texts == context.table_texts, f"{texts} != {context.table_texts}"


@then('the "{section}" items should be in the order "{expected}"')
def step_impl(context, section, expected):
    retro = fetch_retro(context)
    texts = [item['text'] for item in items_of(retro, section)]
    assert texts == [x.strip() for x in expected.split(',')], texts


@then('the "{section}" item "{text}" should have no comments')
def step_impl(context, section, text):
    item = require_item(fetch_retro(context), section, text)
    assert not item.get('comments'), item.get('comments')


@then('the "{section}" item "{text}" should have {count:d} comments')
def step_impl(context, section, text, count):
    item = require_item(fetch_retro(context), section, text)
    assert len(item.get('comments', [])) == count, item.get('comments')


@then('the "{section}" item "{text}" should have {count:d} downvotes')
def step_impl(context, section, text, count):
    item = require_item(fetch_retro(context), section, text)
    assert item.get('down', 0) == count, item


@when('I try to update the "{section}" item "{old_text}" to "{new_text}"')
def step_impl(context, section, old_text, new_text):
    item = require_item(fetch_retro(context), section, old_text)
    context.response = requests.patch(
        f"{BASE_URL}/{context.retro_id}/{section}/{item['id']}",
        json={'text': new_text},
        headers=context.headers)


@when('I update an unknown "{section}" item')
def step_impl(context, section):
    context.response = requests.patch(
        f"{BASE_URL}/{context.retro_id}/{section}/{uuid.uuid4()}",
        json={'text': 'text for an item that does not exist'},
        headers=context.headers)


@when('I delete an unknown "{section}" item')
def step_impl(context, section):
    context.response = requests.delete(
        f"{BASE_URL}/{context.retro_id}/{section}/{uuid.uuid4()}",
        headers=context.headers)


@when('I upvote an unknown "{section}" item')
def step_impl(context, section):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}/{uuid.uuid4()}/up",
        headers=context.headers)


@when('I add a "{section}" item with text {description}')
def step_impl(context, section, description):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}",
        json={'text': sized_text(context, description)},
        headers=context.headers)


@when('I add a "{section}" item without any text')
def step_impl(context, section):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}",
        json={},
        headers=context.headers)


@when('I set the title to a value {description}')
def step_impl(context, description):
    length = TITLE_MAX_LENGTH if description == 'of maximum length' else TITLE_MAX_LENGTH + 1
    context.title_value = 't' * length
    context.response = requests.put(
        f"{BASE_URL}/{context.retro_id}/title",
        json={'title': context.title_value},
        headers=context.headers)


@then('the retrospective title should be that value')
def step_impl(context):
    assert fetch_retro(context).get('title') == context.title_value


@when('I try to set an empty title')
def step_impl(context):
    context.response = requests.put(
        f"{BASE_URL}/{context.retro_id}/title",
        json={'title': ''},
        headers=context.headers)


@when('I try to set the title to "{title}"')
def step_impl(context, title):
    context.response = requests.put(
        f"{BASE_URL}/{context.retro_id}/title",
        json={'title': title},
        headers=context.headers)


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------

@when('I add the following comments to the "{section}" item "{item_text}"')
def step_impl(context, section, item_text):
    item = require_item(fetch_retro(context), section, item_text)
    context.table_comments = [row['text'] for row in context.table]
    for text in context.table_comments:
        response = requests.post(
            f"{BASE_URL}/{context.retro_id}/{section}/{item['id']}/comment",
            json={'text': text},
            headers=context.headers)
        assert response.status_code == 201, response.text


@then('the "{section}" item "{item_text}" should have exactly those comments')
def step_impl(context, section, item_text):
    item = require_item(fetch_retro(context), section, item_text)
    texts = [comment['text'] for comment in item.get('comments', [])]
    assert texts == context.table_comments, f"{texts} != {context.table_comments}"


@when('I add a comment to an unknown "{section}" item')
def step_impl(context, section):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}/{uuid.uuid4()}/comment",
        json={'text': 'comment on a ghost'},
        headers=context.headers)


@when('I update an unknown comment on the "{section}" section')
def step_impl(context, section):
    context.response = requests.patch(
        f"{BASE_URL}/{context.retro_id}/{section}/{uuid.uuid4()}/comment/{uuid.uuid4()}",
        json={'text': 'updated ghost'},
        headers=context.headers)


@when('I delete an unknown comment on the "{section}" section')
def step_impl(context, section):
    context.response = requests.delete(
        f"{BASE_URL}/{context.retro_id}/{section}/{uuid.uuid4()}/comment/{uuid.uuid4()}",
        headers=context.headers)


@when('I try to update the comment "{comment_text}" on the "{section}" item "{item_text}" via the "{other_section}" section')
def step_impl(context, comment_text, section, item_text, other_section):
    item = require_item(fetch_retro(context), section, item_text)
    comment_id = next(c['id'] for c in item['comments'] if c['text'] == comment_text)
    context.response = requests.patch(
        f"{BASE_URL}/{context.retro_id}/{other_section}/{item['id']}/comment/{comment_id}",
        json={'text': 'hijacked'},
        headers=context.headers)


@when('I try to delete the comment "{comment_text}" on the "{section}" item "{item_text}" via the "{other_section}" section')
def step_impl(context, comment_text, section, item_text, other_section):
    item = require_item(fetch_retro(context), section, item_text)
    comment_id = next(c['id'] for c in item['comments'] if c['text'] == comment_text)
    context.response = requests.delete(
        f"{BASE_URL}/{context.retro_id}/{other_section}/{item['id']}/comment/{comment_id}",
        headers=context.headers)


@when('I add a comment with text {description} to the "{section}" item "{item_text}"')
def step_impl(context, description, section, item_text):
    item = require_item(fetch_retro(context), section, item_text)
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}/{item['id']}/comment",
        json={'text': sized_text(context, description)},
        headers=context.headers)


# ---------------------------------------------------------------------------
# Voting
# ---------------------------------------------------------------------------

@given('I upvote the "{section}" item "{text}" {count:d} times')
@when('I upvote the "{section}" item "{text}" {count:d} times')
def step_impl(context, section, text, count):
    item = require_item(fetch_retro(context), section, text)
    for _ in range(count):
        response = requests.post(
            f"{BASE_URL}/{context.retro_id}/{section}/{item['id']}/up",
            headers=context.headers)
        assert response.status_code == 201, response.text


@given('I downvote the "{section}" item "{text}" {count:d} times')
@when('I downvote the "{section}" item "{text}" {count:d} times')
def step_impl(context, section, text, count):
    item = require_item(fetch_retro(context), section, text)
    for _ in range(count):
        response = requests.post(
            f"{BASE_URL}/{context.retro_id}/{section}/{item['id']}/down",
            headers=context.headers)
        assert response.status_code == 201, response.text


@then('the response should contain an action id')
def step_impl(context):
    payload = context.response.json()
    assert 'actionId' in payload, payload
    uuid.UUID(payload['actionId'])


# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------

@when('I send an unauthenticated "{method}" request to "{path}"')
def step_impl(context, method, path):
    context.response = requests.request(
        method,
        f"{BASE_URL}/{context.retro_id}{path}",
        json={'text': 'x', 'title': 'x', 'voteMode': 'up', 'accessKey': 'abcdef'})


@when('I send a "{method}" request to "{path}" with an invalid token')
def step_impl(context, method, path):
    context.response = requests.request(
        method,
        f"{BASE_URL}/{context.retro_id}{path}",
        headers={'x-token': 'not-a-real-token'},
        json={'text': 'x', 'title': 'x', 'voteMode': 'up', 'accessKey': 'abcdef'})


@when('I use the second retrospective\'s token against the first retrospective')
def step_impl(context):
    context.response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers_2)


@then('the response error key should be "{key}"')
def step_impl(context, key):
    payload = context.response.json()
    assert payload.get('key') == key, payload


@then('the response should not reveal the access key')
def step_impl(context):
    retro = fetch_retro(context)
    assert 'accessKey' not in retro, retro


@when('I request the "{endpoint}" admin endpoint with an incorrect admin key')
def step_impl(context, endpoint):
    context.response = requests.get(
        f"{BASE_URL}/{context.retro_id}/{endpoint}",
        headers={**context.headers, 'x-admin-key': 'definitely-not-the-admin-key'})


@when('I try to set the access key to a value of {length:d} characters')
def step_impl(context, length):
    context.response = requests.put(
        f"{BASE_URL}/{context.retro_id}/accessKey",
        json={'accessKey': 'k' * length},
        headers=context.headers)


@when('I try to authenticate with "{key}"')
def step_impl(context, key):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/authenticate",
        json={'accessKey': key})


@then('the response should contain a token')
def step_impl(context):
    assert context.response.json().get('token'), context.response.text


# ---------------------------------------------------------------------------
# Action log
# ---------------------------------------------------------------------------

@when('I request the action log')
def step_impl(context):
    # The action log is written after the response to the triggering request has
    # been sent, so poll until it stops growing before making any assertions.
    previous = None
    for _ in range(30):
        context.response = requests.get(
            f"{BASE_URL}/{context.retro_id}/_actions",
            headers={**context.headers, 'x-admin-key': ADMIN_KEY})
        assert context.response.status_code == 200, context.response.text
        current = context.response.json()
        if previous is not None and len(current) == len(previous):
            break
        previous = current
        time.sleep(0.1)
    context.action_log = previous


@when('I request the retrospective')
def step_impl(context):
    context.response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)


@when('I request the raw retrospective')
def step_impl(context):
    context.response = requests.get(
        f"{BASE_URL}/{context.retro_id}/_raw",
        headers={**context.headers, 'x-admin-key': ADMIN_KEY})
    assert context.response.status_code == 200, context.response.text


@then('the action log should be empty')
def step_impl(context):
    assert context.action_log == [], context.action_log


@then('the action log should contain the actions "{expected}"')
def step_impl(context, expected):
    logged = [entry['action'] for entry in context.action_log]
    for action in [x.strip() for x in expected.split(',')]:
        assert action in logged, f"'{action}' missing from {logged}"


@then('the action log should not contain the action "{action}"')
def step_impl(context, action):
    logged = [entry['action'] for entry in context.action_log]
    assert action not in logged, logged


@then('the action log should contain exactly {count:d} entries')
def step_impl(context, count):
    assert len(context.action_log) == count, context.action_log


@then('every action log entry should have the fields "{expected}"')
def step_impl(context, expected):
    fields = sorted(x.strip() for x in expected.split(','))
    for entry in context.action_log:
        assert sorted(entry.keys()) == fields, entry


@then('every action log entry should refer to this retrospective')
def step_impl(context):
    for entry in context.action_log:
        assert entry['retroId'] == context.retro_id, entry


@then('the action log entries should be in chronological order')
def step_impl(context):
    timestamps = [entry['timestamp'] for entry in context.action_log]
    assert timestamps == sorted(timestamps), timestamps


@then('the action log entry for "{action}" should refer to no item')
def step_impl(context, action):
    entry = next((e for e in context.action_log if e['action'] == action), None)
    assert entry is not None, context.action_log
    assert entry['itemId'] is None, entry


@then('the action log entry for "{action}" should refer to an item')
def step_impl(context, action):
    entry = next((e for e in context.action_log if e['action'] == action), None)
    assert entry is not None, context.action_log
    assert entry['itemId'] is not None, entry


# ---------------------------------------------------------------------------
# API contract
# ---------------------------------------------------------------------------

@when('I add a "{section}" item "{text}" and keep the response')
def step_impl(context, section, text):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}",
        json={'text': text},
        headers=context.headers)


@then('the response should be an acknowledged write result')
def step_impl(context):
    payload = context.response.json()
    assert payload.get('acknowledged') is True, payload
    for field in ('modifiedCount', 'matchedCount', 'upsertedCount'):
        assert field in payload, payload
    assert 'upsertedId' in payload, payload


@then('the response body should be empty')
def step_impl(context):
    assert context.response.text == '', context.response.text


@then('the raw retrospective should contain "{count:d}" "{section}" items')
def step_impl(context, count, section):
    payload = context.response.json()
    assert len(payload.get(json_key(section), [])) == count, payload


@then('the raw retrospective should have title "{title}"')
def step_impl(context, title):
    assert context.response.json().get('title') == title, context.response.text


@then('the response content type should be "{content_type}"')
def step_impl(context, content_type):
    actual = context.response.headers.get('Content-Type', '')
    assert content_type in actual, actual
