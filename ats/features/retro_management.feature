Feature: Retrospective Management

  Scenario: Create a new retrospective
    Given I create a new retrospective
    Then I should receive a retrospective ID
    And the retrospective title should be null
    And the vote mode should be "up"
    And the retrospective should have no "good" items
    And the retrospective should have no "bad" items
    And the retrospective should have no "action" items
    And the retrospective last update timestamp should be null
    And the retrospective should offer a websocket url

  Scenario: Set retrospective title
    Given I create a new retrospective
    When I set the title to "Sprint 112 Retro"
    Then the retrospective title should be "Sprint 112 Retro"

  Scenario: Overwrite retrospective title
    Given I create a new retrospective
    And I set the title to "First title"
    When I set the title to "Second title"
    Then the retrospective title should be "Second title"

  Scenario: Title of maximum length is accepted
    Given I create a new retrospective
    When I set the title to a value of maximum length
    Then the response status should be 200
    And the retrospective title should be that value

  Scenario: Title exceeding the maximum length is rejected
    Given I create a new retrospective
    When I set the title to a value exceeding the maximum length
    Then the response status should be 500

  Scenario: Empty title is rejected
    Given I create a new retrospective
    When I try to set an empty title
    Then the response status should be 500

  Scenario Outline: Vote mode can be set to any supported value
    Given I create a new retrospective
    When I set the vote mode to "<mode>"
    Then the vote mode should be "<mode>"

    Examples:
      | mode   |
      | none   |
      | up     |
      | updown |

  Scenario: Add items to retrospective
    Given I create a new retrospective
    When I add a "good" item "We finished the project"
    And I add a "bad" item "The server crashed"
    And I add a "action" item "Investigate memory leak"
    Then the retrospective should contain "good" item "We finished the project"
    And the retrospective should contain "bad" item "The server crashed"
    And the retrospective should contain "action" item "Investigate memory leak"

  Scenario: Update items
    Given I create a new retrospective
    When I add a "good" item "Original Text"
    And I update the "good" item "Original Text" to "Updated Text"
    Then the retrospective should contain "good" item "Updated Text"
    And the retrospective should not contain "good" item "Original Text"

  Scenario: Delete items
    Given I create a new retrospective
    When I add a "bad" item "To be deleted"
    And I delete the "bad" item "To be deleted"
    Then the retrospective should not contain "bad" item "To be deleted"

  Scenario: Manage comments
    Given I create a new retrospective
    When I add a "good" item "Item with comment"
    And I add a comment "First comment" to the "good" item "Item with comment"
    Then the "good" item "Item with comment" should have a comment "First comment"
    When I update the comment "First comment" to "Updated comment" on the "good" item "Item with comment"
    Then the "good" item "Item with comment" should have a comment "Updated comment"
    When I delete the comment "Updated comment" on the "good" item "Item with comment"
    Then the "good" item "Item with comment" should not have a comment "Updated comment"

  Scenario: Manage comments on action items
    Given I create a new retrospective
    When I add a "action" item "Action with comment"
    And I add a comment "Action comment" to the "action" item "Action with comment"
    Then the "action" item "Action with comment" should have a comment "Action comment"
    When I update the comment "Action comment" to "Updated action comment" on the "action" item "Action with comment"
    Then the "action" item "Action with comment" should have a comment "Updated action comment"
    When I delete the comment "Updated action comment" on the "action" item "Action with comment"
    Then the "action" item "Action with comment" should not have a comment "Updated action comment"

  Scenario: Reject duplicate items
    Given I create a new retrospective
    When I add a "good" item "Duplicate text"
    And I try to add a "good" item "Duplicate text"
    Then the response status should be 422
    And the response should include an error message containing "There is already an item"

  Scenario: The retrospective exposes its own identifier once it has been persisted
    Given I create a new retrospective
    When I set the title to "Persisted"
    Then the retrospective should expose an identifier

  Scenario: The last update timestamp is recorded on the first change
    Given I create a new retrospective
    Then the retrospective last update timestamp should be null
    When I add a "good" item "Something happened"
    Then the retrospective last update timestamp should be set

  Scenario: The last update timestamp advances with every change
    Given I create a new retrospective
    And I add a "good" item "First change"
    And I remember the last update timestamp
    When I set the title to "Second change"
    Then the last update timestamp should have advanced

  Scenario Outline: Every kind of change updates the last update timestamp
    Given I create a new retrospective
    And I add a "good" item "Anchor item"
    And I remember the last update timestamp
    When <change>
    Then the last update timestamp should have advanced

    Examples:
      | change                                                   |
      | I set the title to "Changed"                             |
      | I set the vote mode to "updown"                          |
      | I add a "bad" item "Another item"                        |
      | I upvote the "good" item "Anchor item"                   |
      | I update the "good" item "Anchor item" to "Renamed item" |
      | I delete the "good" item "Anchor item"                   |

  Scenario: Retrospectives are isolated from one another
    Given I create a new retrospective
    And I have a second retrospective
    When I add a "good" item "Only in the first"
    And I add a "good" item "Only in the second" to the second retrospective
    Then the retrospective should contain "good" item "Only in the first"
    And the retrospective should not contain "good" item "Only in the second"
    And the second retrospective should contain "good" item "Only in the second"
    And the second retrospective should not contain "good" item "Only in the first"

  Scenario: Retrospective settings are isolated from one another
    Given I create a new retrospective
    And I have a second retrospective
    When I set the title to "First retro"
    And I set the vote mode to "updown"
    Then the retrospective title should be "First retro"
    And the vote mode should be "updown"
