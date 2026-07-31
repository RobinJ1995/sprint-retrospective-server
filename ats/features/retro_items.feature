Feature: Retrospective Items

  Scenario Outline: Newly added items start out empty
    Given I create a new retrospective
    When I add a "<section>" item "Brand new item"
    Then the retrospective should contain "<section>" item "Brand new item"
    And the "<section>" item "Brand new item" should have 0 upvotes
    And the "<section>" item "Brand new item" should have 0 downvotes
    And the "<section>" item "Brand new item" should have no comments

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario Outline: Items keep their insertion order
    Given I create a new retrospective
    When I add a "<section>" item "First"
    And I add a "<section>" item "Second"
    And I add a "<section>" item "Third"
    And I add a "<section>" item "Fourth"
    Then the "<section>" items should be in the order "First, Second, Third, Fourth"

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Insertion order survives updates and deletions
    Given I create a new retrospective
    And I add a "good" item "One"
    And I add a "good" item "Two"
    And I add a "good" item "Three"
    When I update the "good" item "Two" to "Two updated"
    Then the "good" items should be in the order "One, Two updated, Three"
    When I delete the "good" item "One"
    Then the "good" items should be in the order "Two updated, Three"

  Scenario: Item text is stored verbatim
    Given I create a new retrospective
    When I add the following "good" items
      | text                                     |
      | héllo wörld with àccénts                 |
      | emoji 🎉🚀 and symbols ✓ ±               |
      | single ' quote and backtick `            |
      | sql-ish '; DROP TABLE retro; --          |
      | backslash \ percent % underscore _       |
      | <b>html</b> &amp; entities               |
      | {"json": "like"} and [array]             |
      | 日本語のテキスト                            |
    Then the "good" section should contain exactly those items

  Scenario: Updates preserve votes and comments
    Given I create a new retrospective
    And I add a "good" item "Popular item"
    And I add a comment "A useful note" to the "good" item "Popular item"
    When I upvote the "good" item "Popular item" 3 times
    And I downvote the "good" item "Popular item" 2 times
    And I update the "good" item "Popular item" to "Popular item, renamed"
    Then the "good" item "Popular item, renamed" should have 3 upvotes
    And the "good" item "Popular item, renamed" should have 2 downvotes
    And the "good" item "Popular item, renamed" should have a comment "A useful note"

  Scenario: Deleting an item leaves the other items untouched
    Given I create a new retrospective
    And I add a "bad" item "Keep me"
    And I add a "bad" item "Delete me"
    And I add a "bad" item "Keep me too"
    And I upvote the "bad" item "Keep me" 2 times
    When I delete the "bad" item "Delete me"
    Then the retrospective should not contain "bad" item "Delete me"
    And the retrospective should have 2 "bad" items
    And the "bad" item "Keep me" should have 2 upvotes

  Scenario: Duplicate detection is case sensitive
    Given I create a new retrospective
    And I add a "good" item "Case Sensitive"
    When I try to add a "good" item "case sensitive"
    Then the response status should be 201
    And the retrospective should have 2 "good" items

  Scenario: Duplicate detection is whitespace sensitive
    Given I create a new retrospective
    And I add a "good" item "Trailing space"
    When I try to add a "good" item "Trailing space "
    Then the response status should be 201
    And the retrospective should have 2 "good" items

  Scenario: Duplicate detection is scoped to a single section
    Given I create a new retrospective
    And I add a "good" item "Shared text"
    When I try to add a "bad" item "Shared text"
    Then the response status should be 201
    When I try to add a "action" item "Shared text"
    Then the response status should be 201
    And the retrospective should contain "good" item "Shared text"
    And the retrospective should contain "bad" item "Shared text"
    And the retrospective should contain "action" item "Shared text"

  Scenario: Duplicate detection is scoped to a single retrospective
    Given I create a new retrospective
    And I have a second retrospective
    And I add a "good" item "Shared across retros"
    When I add a "good" item "Shared across retros" to the second retrospective
    Then the retrospective should contain "good" item "Shared across retros"
    And the second retrospective should contain "good" item "Shared across retros"

  Scenario Outline: Duplicates are rejected in every section
    Given I create a new retrospective
    And I add a "<section>" item "Repeated"
    When I try to add a "<section>" item "Repeated"
    Then the response status should be 422
    And the response should include an error message containing "There is already an item with "

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Updating an item to text that already exists is rejected
    Given I create a new retrospective
    And I add a "good" item "Alpha"
    And I add a "good" item "Beta"
    When I try to update the "good" item "Beta" to "Alpha"
    Then the response status should be 422
    And the retrospective should contain "good" item "Beta"
    And the retrospective should have 2 "good" items

  Scenario: Updating an item to its own text is rejected
    Given I create a new retrospective
    And I add a "good" item "Unchanged"
    When I try to update the "good" item "Unchanged" to "Unchanged"
    Then the response status should be 422
    And the retrospective should contain "good" item "Unchanged"

  Scenario Outline: Operating on an unknown item is a no-op
    Given I create a new retrospective
    And I add a "<section>" item "Bystander"
    When I update an unknown "<section>" item
    Then the response status should be 200
    When I delete an unknown "<section>" item
    Then the response status should be 200
    When I upvote an unknown "<section>" item
    Then the response status should be 201
    And the retrospective should have 1 "<section>" items
    And the "<section>" item "Bystander" should have 0 upvotes

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Operating on an unknown item in an untouched retrospective is a no-op
    Given I create a new retrospective
    When I delete an unknown "good" item
    Then the response status should be 200
    When I update an unknown "bad" item
    Then the response status should be 200
    And the retrospective should have no "good" items
    And the retrospective should have no "bad" items

  Scenario Outline: Item text of maximum length is accepted
    Given I create a new retrospective
    When I add a "<section>" item with text of maximum length
    Then the response status should be 201
    And the retrospective should have 1 "<section>" items

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario Outline: Item text exceeding the maximum length is rejected
    Given I create a new retrospective
    When I add a "<section>" item with text exceeding the maximum length
    Then the response status should be 500
    And the retrospective should have no "<section>" items

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario Outline: Empty or missing item text is rejected
    Given I create a new retrospective
    When I add a "<section>" item with text that is empty
    Then the response status should be 500
    When I add a "<section>" item without any text
    Then the response status should be 500
    And the retrospective should have no "<section>" items

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |
