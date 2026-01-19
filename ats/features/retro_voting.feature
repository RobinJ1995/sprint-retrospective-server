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
