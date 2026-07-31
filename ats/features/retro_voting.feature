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

  Scenario Outline: Upvotes and downvotes are counted independently
    Given I create a new retrospective
    And I set the vote mode to "updown"
    And I add a "<section>" item "Counted item"
    When I upvote the "<section>" item "Counted item" 5 times
    And I downvote the "<section>" item "Counted item" 3 times
    Then the "<section>" item "Counted item" should have 5 upvotes
    And the "<section>" item "Counted item" should have 3 downvotes

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Votes are counted per item
    Given I create a new retrospective
    And I add a "good" item "Popular"
    And I add a "good" item "Unpopular"
    When I upvote the "good" item "Popular" 4 times
    Then the "good" item "Popular" should have 4 upvotes
    And the "good" item "Unpopular" should have 0 upvotes

  Scenario: Votes are counted per section
    Given I create a new retrospective
    And I add a "good" item "Same name"
    And I add a "bad" item "Same name"
    When I upvote the "good" item "Same name" 2 times
    Then the "good" item "Same name" should have 2 upvotes
    And the "bad" item "Same name" should have 0 upvotes

  Scenario: Votes are counted per retrospective
    Given I create a new retrospective
    And I have a second retrospective
    And I add a "good" item "Shared name"
    And I add a "good" item "Shared name" to the second retrospective
    When I upvote the "good" item "Shared name" 3 times
    Then the "good" item "Shared name" should have 3 upvotes
    And the second retrospective should contain "good" item "Shared name"

  Scenario: The server does not restrict voting based on the vote mode
    Given I create a new retrospective
    And I set the vote mode to "none"
    And I add a "good" item "Vote mode ignored"
    When I upvote the "good" item "Vote mode ignored"
    And I downvote the "good" item "Vote mode ignored"
    Then the "good" item "Vote mode ignored" should have 1 upvote
    And the "good" item "Vote mode ignored" should have 1 downvote

  Scenario Outline: Voting on an unknown item is accepted without changing anything
    Given I create a new retrospective
    And I add a "<section>" item "Untouched"
    When I upvote an unknown "<section>" item
    Then the response status should be 201
    And the response should contain an action id
    And the "<section>" item "Untouched" should have 0 upvotes

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Vote responses carry an action id
    Given I create a new retrospective
    And I add a "good" item "Tracked item"
    When I upvote the "good" item "Tracked item"
    Then the "good" item "Tracked item" should have 1 upvote

  Scenario Outline: Invalid vote modes are rejected
    Given I create a new retrospective
    When I try to set the vote mode to "<mode>"
    Then the response status should be 500
    And the vote mode should be "up"

    Examples:
      | mode      |
      | UP        |
      | UPDOWN    |
      | Up        |
      | upvote    |
      | undefined |
