Feature: Retrospective Action Log

  Scenario: A new retrospective has an empty action log
    Given I create a new retrospective
    When I request the action log
    Then the action log should be empty

  Scenario: Retrospective settings changes are recorded
    Given I create a new retrospective
    And I set the title to "Logged retro"
    And I set the vote mode to "updown"
    And I set the access key to "loggedkey"
    When I request the action log
    Then the action log should contain the actions "set_title, set_vote_mode, set_access_key"
    And the action log should contain exactly 3 entries
    And the action log entry for "set_title" should refer to no item

  Scenario Outline: Item lifecycle changes are recorded for the "<section>" section
    Given I create a new retrospective
    And I add a "<section>" item "Logged item"
    And I update the "<section>" item "Logged item" to "Logged item, renamed"
    And I upvote the "<section>" item "Logged item, renamed"
    And I downvote the "<section>" item "Logged item, renamed"
    When I request the action log
    Then the action log should contain the actions "<expected>"

    Examples:
      | section | expected                                       |
      | good    | add_good, update_good, upvote_good, downvote_good |
      | bad     | add_bad, update_bad, upvote_bad, downvote_bad     |

  Scenario: Deleting an item is recorded
    Given I create a new retrospective
    And I add a "good" item "Doomed item"
    And I delete the "good" item "Doomed item"
    When I request the action log
    Then the action log should contain the actions "add_good, delete_good"
    And the action log entry for "delete_good" should refer to an item

  Scenario: Adding an item is recorded without an item reference
    Given I create a new retrospective
    And I add a "good" item "Freshly added"
    When I request the action log
    Then the action log should contain exactly 1 entries
    And the action log entry for "add_good" should refer to no item

  Scenario: Comment changes are recorded
    Given I create a new retrospective
    And I add a "good" item "Commented item"
    And I add a comment "A comment" to the "good" item "Commented item"
    And I update the comment "A comment" to "An amended comment" on the "good" item "Commented item"
    And I delete the comment "An amended comment" on the "good" item "Commented item"
    When I request the action log
    Then the action log should contain the actions "add_comment, update_comment, delete_comment"
    And the action log entry for "add_comment" should refer to an item

  Scenario: Adding or updating an action item is not recorded
    Given I create a new retrospective
    And I add a "action" item "Unlogged action"
    And I update the "action" item "Unlogged action" to "Still unlogged"
    When I request the action log
    Then the action log should be empty

  Scenario: Deleting an action item is recorded as an addition
    Given I create a new retrospective
    And I add a "action" item "Removable action"
    And I delete the "action" item "Removable action"
    When I request the action log
    Then the action log should contain the actions "add_action"
    And the action log should contain exactly 1 entries

  Scenario: Voting on an action item is recorded as an update and a deletion
    Given I create a new retrospective
    And I add a "action" item "Voted action"
    And I upvote the "action" item "Voted action"
    And I downvote the "action" item "Voted action"
    When I request the action log
    Then the action log should contain the actions "update_action, delete_action"
    And the action log should contain exactly 2 entries

  Scenario: Action log entries only expose the documented fields
    Given I create a new retrospective
    And I add a "good" item "Field check"
    And I set the title to "Field check retro"
    When I request the action log
    Then every action log entry should have the fields "retroId, itemId, action, timestamp"
    And every action log entry should refer to this retrospective

  Scenario: Action log entries are returned in chronological order
    Given I create a new retrospective
    And I set the title to "Ordered retro"
    And I add a "good" item "Ordered item"
    And I add a "bad" item "Another ordered item"
    And I set the vote mode to "updown"
    When I request the action log
    Then the action log should contain exactly 4 entries
    And the action log entries should be in chronological order

  Scenario: Action logs are kept per retrospective
    Given I create a new retrospective
    And I have a second retrospective
    And I add a "good" item "Only in the first retro"
    And I add a "good" item "Only in the second retro" to the second retrospective
    When I request the action log
    Then the action log should contain exactly 1 entries
    And every action log entry should refer to this retrospective
