Feature: Retrospective Management

  Scenario: Create a new retrospective
    Given I create a new retrospective
    Then I should receive a retrospective ID
    And the retrospective title should be null
    And the vote mode should be "up"

  Scenario: Set retrospective title
    Given I create a new retrospective
    When I set the title to "Sprint 112 Retro"
    Then the retrospective title should be "Sprint 112 Retro"

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
