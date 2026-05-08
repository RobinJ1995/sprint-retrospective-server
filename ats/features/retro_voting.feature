Feature: Retrospective Voting

  Scenario: Upvote items
    Given I create a new retrospective
    When I add a "good" item "Votable Item"
    And I upvote the "good" item "Votable Item"
    Then the "good" item "Votable Item" should have 1 upvote

  Scenario: Downvote items
    Given I create a new retrospective
    And I set the vote mode to "updown"
    When I add a "bad" item "Controversial Item"
    And I downvote the "bad" item "Controversial Item"
    Then the "bad" item "Controversial Item" should have 1 downvote

  Scenario: Multiple votes
    Given I create a new retrospective
    When I add a "action" item "Important Action"
    And I upvote the "action" item "Important Action"
    And I upvote the "action" item "Important Action"
    Then the "action" item "Important Action" should have 2 upvotes

  Scenario: Vote mode validation
    Given I create a new retrospective
    When I try to set the vote mode to "invalid-mode"
    Then the response status should be 500
    And the response should include an error message containing "Internal Server Error"

  Scenario: Voting across all sections
    Given I create a new retrospective
    And I set the vote mode to "updown"
    And I add a "good" item "Cross-section good"
    And I add a "bad" item "Cross-section bad"
    And I add a "action" item "Cross-section action"
    When I downvote the "good" item "Cross-section good"
    And I upvote the "bad" item "Cross-section bad"
    And I downvote the "action" item "Cross-section action"
    Then the "good" item "Cross-section good" should have 1 downvote
    And the "bad" item "Cross-section bad" should have 1 upvote
    And the "action" item "Cross-section action" should have 1 downvote
