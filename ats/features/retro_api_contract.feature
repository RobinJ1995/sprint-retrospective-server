Feature: Retrospective API Contract

  Scenario Outline: Write endpoints answer with an acknowledged write result
    Given I create a new retrospective
    When <change>
    Then the response status should be <status>
    And the response content type should be "application/json"
    And the response should be an acknowledged write result

    Examples:
      | change                                                | status |
      | I add a "good" item "Contract item" and keep the response | 201 |
      | I try to set the title to "Contract title"             | 200    |
      | I try to set the vote mode to "updown"                 | 200    |
      | I try to set the access key to "contractkey"           | 201    |

  Scenario: Updating an item answers with an acknowledged write result
    Given I create a new retrospective
    And I add a "good" item "Before update"
    When I try to update the "good" item "Before update" to "After update"
    Then the response status should be 200
    And the response should be an acknowledged write result

  Scenario: Deleting an unknown item answers with an acknowledged write result
    Given I create a new retrospective
    When I delete an unknown "good" item
    Then the response status should be 200
    And the response should be an acknowledged write result

  Scenario: Voting answers with an action id
    Given I create a new retrospective
    And I add a "good" item "Action id item"
    When I upvote an unknown "good" item
    Then the response status should be 201
    And the response content type should be "application/json"
    And the response should contain an action id

  Scenario: Adding a comment answers with an action id
    Given I create a new retrospective
    And I add a "good" item "Comment contract item"
    When I add a comment to an unknown "good" item
    Then the response status should be 201
    And the response should contain an action id

  Scenario: Deleting a comment answers with an empty body
    Given I create a new retrospective
    When I delete an unknown comment on the "good" section
    Then the response status should be 204
    And the response body should be empty

  Scenario: The raw endpoint returns the stored retrospective
    Given I create a new retrospective
    And I set the title to "Raw retro"
    And I set the access key to "rawkey"
    And I add a "good" item "Raw item"
    And I add a "bad" item "Another raw item"
    When I request the raw retrospective
    Then the response status should be 200
    And the raw retrospective should have title "Raw retro"
    And the raw retrospective should include access key "rawkey"
    And the raw retrospective should contain "1" "good" items
    And the raw retrospective should contain "1" "bad" items

  Scenario: The raw endpoint returns nothing for a retrospective that was never changed
    Given I create a new retrospective
    When I request the raw retrospective
    Then the response status should be 200
    And the response body should be empty

  Scenario: The public endpoint returns json
    Given I create a new retrospective
    When I request the retrospective
    Then the response status should be 200
    And the response content type should be "application/json"

  Scenario: Health reports json
    When I request service health
    Then the response status should be 200
    And the response content type should be "application/json"
