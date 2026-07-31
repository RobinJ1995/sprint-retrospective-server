import requests
import uuid
from behave import given, when, then, step

BASE_URL = "http://localhost:5432"
ADMIN_KEY = "c74c12d6-7842-4fee-b476-47f4cf3f6526"

def get_token(context):
    # Authenticate to get a token
    # POST /:id/authenticate
    response = requests.post(f"{BASE_URL}/{context.retro_id}/authenticate")
    assert response.status_code == 200
    context.token = response.json().get('token')
    context.headers = {'x-token': context.token}

@given('I create a new retrospective')
def step_impl(context):
    context.retro_id = str(uuid.uuid4())
    # Authenticate immediately
    get_token(context)
    
    context.response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    assert context.response.status_code == 200
    context.retro = context.response.json()

@then('I should receive a retrospective ID')
def step_impl(context):
    assert context.retro_id is not None

@then('the retrospective title should be null')
def step_impl(context):
    assert context.retro.get('title') is None

@given('I set the vote mode to "{mode}"')
@when('I set the vote mode to "{mode}"')
def step_impl(context, mode):
    response = requests.put(f"{BASE_URL}/{context.retro_id}/voteMode", json={'voteMode': mode}, headers=context.headers)
    assert response.status_code == 200
    # Refresh retro context
    context.response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    context.retro = context.response.json()

@then('the vote mode should be "{mode}"')
def step_impl(context, mode):
    assert context.retro.get('voteMode') == mode

@given('I set the title to "{title}"')
@when('I set the title to "{title}"')
def step_impl(context, title):
    response = requests.put(f"{BASE_URL}/{context.retro_id}/title", json={'title': title}, headers=context.headers)
    assert response.status_code == 200
    # Refresh retro context
    context.response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    context.retro = context.response.json()

@then('the retrospective title should be "{title}"')
def step_impl(context, title):
    assert context.retro.get('title') == title

@given('I add a "{section}" item "{text}"')
@when('I add a "{section}" item "{text}"')
def step_impl(context, section, text):
    response = requests.post(f"{BASE_URL}/{context.retro_id}/{section}", json={'text': text}, headers=context.headers)
    assert response.status_code == 201
    context.last_item_id = response.json().get('id')

@then('the retrospective should contain "{section}" item "{text}"')
def step_impl(context, section, text):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    
    if section == 'action':
        json_key = 'actions'
    else:
        json_key = section
        
    items = retro.get(json_key, [])
    found = any(item['text'] == text for item in items)
    assert found, f"Item '{text}' not found in section '{section}'"

@then('the retrospective should not contain "{section}" item "{text}"')
def step_impl(context, section, text):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    
    if section == 'action':
        json_key = 'actions'
    else:
        json_key = section
        
    items = retro.get(json_key, [])
    found = any(item['text'] == text for item in items)
    assert not found, f"Item '{text}' found in section '{section}' but shouldn't be"

@given('I update the "{section}" item "{old_text}" to "{new_text}"')
@when('I update the "{section}" item "{old_text}" to "{new_text}"')
def step_impl(context, section, old_text, new_text):
    # Find item ID first
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item_id = next((item['id'] for item in items if item['text'] == old_text), None)
    assert item_id is not None, f"Item '{old_text}' not found"

    response = requests.patch(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}", json={'text': new_text}, headers=context.headers)
    assert response.status_code == 200

@given('I delete the "{section}" item "{text}"')
@when('I delete the "{section}" item "{text}"')
def step_impl(context, section, text):
    # Find item ID first
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item_id = next((item['id'] for item in items if item['text'] == text), None)
    assert item_id is not None, f"Item '{text}' not found"

    response = requests.delete(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}", headers=context.headers)
    assert response.status_code == 200

# Voting Steps
@given('I upvote the "{section}" item "{text}"')
@when('I upvote the "{section}" item "{text}"')
def step_impl(context, section, text):
    # Find item ID first
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item_id = next((item['id'] for item in items if item['text'] == text), None)
    assert item_id is not None, f"Item '{text}' not found"

    response = requests.post(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}/up", headers=context.headers)
    assert response.status_code == 201

@given('I downvote the "{section}" item "{text}"')
@when('I downvote the "{section}" item "{text}"')
def step_impl(context, section, text):
    # Find item ID first
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item_id = next((item['id'] for item in items if item['text'] == text), None)
    assert item_id is not None, f"Item '{text}' not found"

    response = requests.post(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}/down", headers=context.headers)
    assert response.status_code == 201

@then('the "{section}" item "{text}" should have {count:d} upvote')
@then('the "{section}" item "{text}" should have {count:d} upvotes')
def step_impl(context, section, text, count):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item = next((item for item in items if item['text'] == text), None)
    assert item is not None, f"Item '{text}' not found"
    assert item.get('up', 0) == count

@then('the "{section}" item "{text}" should have {count:d} downvote')
def step_impl(context, section, text, count):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item = next((item for item in items if item['text'] == text), None)
    assert item is not None, f"Item '{text}' not found"
    assert item.get('down', 0) == count

# Comment Steps
@given('I add a comment "{comment}" to the "{section}" item "{item_text}"')
@when('I add a comment "{comment}" to the "{section}" item "{item_text}"')
def step_impl(context, comment, section, item_text):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item_id = next((item['id'] for item in items if item['text'] == item_text), None)
    assert item_id is not None, f"Item '{item_text}' not found"

    response = requests.post(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}/comment", json={'text': comment}, headers=context.headers)
    assert response.status_code == 201

@then('the "{section}" item "{item_text}" should have a comment "{comment}"')
def step_impl(context, section, item_text, comment):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item = next((item for item in items if item['text'] == item_text), None)
    assert item is not None, f"Item '{item_text}' not found"
    comments = item.get('comments', [])
    found = any(c['text'] == comment for c in comments)
    assert found

@then('the "{section}" item "{item_text}" should not have a comment "{comment}"')
def step_impl(context, section, item_text, comment):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item = next((item for item in items if item['text'] == item_text), None)
    assert item is not None, f"Item '{item_text}' not found"
    comments = item.get('comments', [])
    found = any(c['text'] == comment for c in comments)
    assert not found

@given('I update the comment "{old_comment}" to "{new_comment}" on the "{section}" item "{item_text}"')
@when('I update the comment "{old_comment}" to "{new_comment}" on the "{section}" item "{item_text}"')
def step_impl(context, old_comment, new_comment, section, item_text):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item = next((item for item in items if item['text'] == item_text), None)
    assert item is not None, f"Item '{item_text}' not found"
    
    comments = item.get('comments', [])
    comment_id = next((c['id'] for c in comments if c['text'] == old_comment), None)
    assert comment_id is not None
    
    # Need item_id as well
    item_id = item['id']

    response = requests.patch(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}/comment/{comment_id}", json={'text': new_comment}, headers=context.headers)
    assert response.status_code == 200

@given('I delete the comment "{comment}" on the "{section}" item "{item_text}"')
@when('I delete the comment "{comment}" on the "{section}" item "{item_text}"')
def step_impl(context, comment, section, item_text):
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    retro = response.json()
    json_key = 'actions' if section == 'action' else section
    items = retro.get(json_key, [])
    item = next((item for item in items if item['text'] == item_text), None)
    assert item is not None, f"Item '{item_text}' not found"
    
    comments = item.get('comments', [])
    comment_id = next((c['id'] for c in comments if c['text'] == comment), None)
    assert comment_id is not None
    
    item_id = item['id']

    response = requests.delete(f"{BASE_URL}/{context.retro_id}/{section}/{item_id}/comment/{comment_id}", headers=context.headers)
    assert response.status_code == 204

# Security Steps
@given('I set the access key to "{key}"')
@when('I set the access key to "{key}"')
def step_impl(context, key):
    response = requests.put(f"{BASE_URL}/{context.retro_id}/accessKey", json={'accessKey': key}, headers=context.headers)
    assert response.status_code == 201

@then('the retrospective should differ from the public version')
def step_impl(context):
    # Try to authenticate without key (should fail now that key is set)
    response = requests.post(f"{BASE_URL}/{context.retro_id}/authenticate")
    assert response.status_code == 401

@when('I authenticate with "{key}"')
def step_impl(context, key):
    response = requests.post(f"{BASE_URL}/{context.retro_id}/authenticate", json={'accessKey': key})
    if response.status_code == 200:
        context.auth_response = response.json()
        context.token = context.auth_response.get('token')
        context.headers = {'x-token': context.token}
    else:
        context.auth_error = response.status_code

@then('I should have a valid token')
def step_impl(context):
    assert context.token is not None
    # Verify token allows access
    response = requests.get(f"{BASE_URL}/{context.retro_id}/", headers=context.headers)
    assert response.status_code == 200

@then('I should receive an authentication error')
def step_impl(context):
    assert context.auth_error == 401 or context.auth_error == 403


@given('I try to add a "{section}" item "{text}"')
@then('I try to add a "{section}" item "{text}"')
@when('I try to add a "{section}" item "{text}"')
def step_impl(context, section, text):
    context.response = requests.post(
        f"{BASE_URL}/{context.retro_id}/{section}",
        json={'text': text},
        headers=context.headers
    )


@when('I try to set the vote mode to "{mode}"')
def step_impl(context, mode):
    context.response = requests.put(
        f"{BASE_URL}/{context.retro_id}/voteMode",
        json={'voteMode': mode},
        headers=context.headers
    )


@when('I try to set the access key to "{key}"')
def step_impl(context, key):
    context.response = requests.put(
        f"{BASE_URL}/{context.retro_id}/accessKey",
        json={'accessKey': key},
        headers=context.headers
    )


@when('I request the retrospective without authentication')
def step_impl(context):
    context.response = requests.get(f"{BASE_URL}/{context.retro_id}/")


@when('I request the "{endpoint}" admin endpoint without admin permissions')
def step_impl(context, endpoint):
    context.response = requests.get(
        f"{BASE_URL}/{context.retro_id}/{endpoint}",
        headers=context.headers
    )


@when('I request the "{endpoint}" admin endpoint with admin permissions')
def step_impl(context, endpoint):
    headers = {
        **context.headers,
        'x-admin-key': ADMIN_KEY
    }
    context.response = requests.get(
        f"{BASE_URL}/{context.retro_id}/{endpoint}",
        headers=headers
    )


@when('I request service health')
def step_impl(context):
    context.response = requests.get(f"{BASE_URL}/health")


@then('the response status should be {status:d}')
def step_impl(context, status):
    assert context.response.status_code == status


@then('the response should include an error message containing "{message}"')
def step_impl(context, message):
    if 'application/json' in context.response.headers.get('Content-Type', ''):
        payload = context.response.json()
        response_message = payload.get('message', '')
    else:
        response_message = context.response.text

    assert message in response_message


@then('the health check should report all dependencies as healthy')
def step_impl(context):
    payload = context.response.json()
    assert payload.get('database') is True
    assert payload.get('redis') is True
    assert payload.get('message_queue') is True


@then('the raw retrospective should include access key "{key}"')
def step_impl(context, key):
    payload = context.response.json()
    assert payload.get('accessKey') == key


@then('the response should be a list of actions')
def step_impl(context):
    payload = context.response.json()
    assert isinstance(payload, list)


@then('the action log should contain at least {count:d} entries')
def step_impl(context, count):
    payload = context.response.json()
    assert len(payload) >= count
