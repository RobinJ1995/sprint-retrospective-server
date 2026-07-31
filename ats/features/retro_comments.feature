Feature: Retrospective Comments

  Scenario Outline: Comments can be managed on items in every section
    Given I create a new retrospective
    And I add a "<section>" item "Commentable"
    When I add a comment "Original comment" to the "<section>" item "Commentable"
    Then the "<section>" item "Commentable" should have a comment "Original comment"
    And the "<section>" item "Commentable" should have 1 comments
    When I update the comment "Original comment" to "Amended comment" on the "<section>" item "Commentable"
    Then the "<section>" item "Commentable" should have a comment "Amended comment"
    And the "<section>" item "Commentable" should not have a comment "Original comment"
    When I delete the comment "Amended comment" on the "<section>" item "Commentable"
    Then the "<section>" item "Commentable" should not have a comment "Amended comment"
    And the "<section>" item "Commentable" should have no comments

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Comments keep their insertion order
    Given I create a new retrospective
    And I add a "good" item "Discussed item"
    When I add the following comments to the "good" item "Discussed item"
      | text            |
      | First remark    |
      | Second remark   |
      | Third remark    |
      | Fourth remark   |
    Then the "good" item "Discussed item" should have exactly those comments

  Scenario: Comment text is stored verbatim
    Given I create a new retrospective
    And I add a "bad" item "Item with tricky comments"
    When I add the following comments to the "bad" item "Item with tricky comments"
      | text                              |
      | héllo wörld 🎉                    |
      | single ' quote                    |
      | sql-ish '; DROP TABLE retro; --   |
      | backslash \ percent % underscore _ |
      | 日本語のコメント                     |
    Then the "bad" item "Item with tricky comments" should have exactly those comments

  Scenario: Duplicate comment text is allowed
    Given I create a new retrospective
    And I add a "good" item "Repeated comments"
    When I add a comment "Same text" to the "good" item "Repeated comments"
    And I add a comment "Same text" to the "good" item "Repeated comments"
    Then the "good" item "Repeated comments" should have 2 comments

  Scenario: Deleting one comment leaves the others in place
    Given I create a new retrospective
    And I add a "good" item "Multi comment item"
    And I add a comment "Keep one" to the "good" item "Multi comment item"
    And I add a comment "Remove me" to the "good" item "Multi comment item"
    And I add a comment "Keep two" to the "good" item "Multi comment item"
    When I delete the comment "Remove me" on the "good" item "Multi comment item"
    Then the "good" item "Multi comment item" should have 2 comments
    And the "good" item "Multi comment item" should have a comment "Keep one"
    And the "good" item "Multi comment item" should have a comment "Keep two"

  Scenario: Comments belong to a single item
    Given I create a new retrospective
    And I add a "good" item "Item one"
    And I add a "good" item "Item two"
    When I add a comment "Belongs to item one" to the "good" item "Item one"
    Then the "good" item "Item one" should have 1 comments
    And the "good" item "Item two" should have no comments

  Scenario Outline: Commenting on an unknown item is a no-op
    Given I create a new retrospective
    And I add a "<section>" item "Bystander item"
    When I add a comment to an unknown "<section>" item
    Then the response status should be 201
    And the "<section>" item "Bystander item" should have no comments

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario Outline: Updating or deleting an unknown comment is a no-op
    Given I create a new retrospective
    And I add a "<section>" item "Bystander item"
    And I add a comment "Untouched" to the "<section>" item "Bystander item"
    When I update an unknown comment on the "<section>" section
    Then the response status should be 200
    When I delete an unknown comment on the "<section>" section
    Then the response status should be 204
    And the "<section>" item "Bystander item" should have a comment "Untouched"

    Examples:
      | section |
      | good    |
      | bad     |
      | action  |

  Scenario: Comment updates are scoped to the section given in the request
    Given I create a new retrospective
    And I add a "good" item "Scoped item"
    And I add a comment "Section scoped" to the "good" item "Scoped item"
    When I try to update the comment "Section scoped" on the "good" item "Scoped item" via the "bad" section
    Then the response status should be 200
    And the "good" item "Scoped item" should have a comment "Section scoped"

  Scenario: Comment deletions are scoped to the section given in the request
    Given I create a new retrospective
    And I add a "good" item "Scoped item"
    And I add a comment "Section scoped" to the "good" item "Scoped item"
    When I try to delete the comment "Section scoped" on the "good" item "Scoped item" via the "bad" section
    Then the response status should be 204
    And the "good" item "Scoped item" should have a comment "Section scoped"

  Scenario: Comment text of maximum length is accepted
    Given I create a new retrospective
    And I add a "good" item "Long comment item"
    When I add a comment with text of maximum length to the "good" item "Long comment item"
    Then the response status should be 201
    And the "good" item "Long comment item" should have 1 comments

  Scenario: Comment text exceeding the maximum length is rejected
    Given I create a new retrospective
    And I add a "good" item "Long comment item"
    When I add a comment with text exceeding the maximum length to the "good" item "Long comment item"
    Then the response status should be 500
    And the "good" item "Long comment item" should have no comments

  Scenario: Empty comment text is rejected
    Given I create a new retrospective
    And I add a "good" item "Empty comment item"
    When I add a comment with text that is empty to the "good" item "Empty comment item"
    Then the response status should be 500
    And the "good" item "Empty comment item" should have no comments

  Scenario: Comments survive voting on their item
    Given I create a new retrospective
    And I add a "good" item "Voted and commented"
    And I add a comment "Still here" to the "good" item "Voted and commented"
    When I upvote the "good" item "Voted and commented" 2 times
    Then the "good" item "Voted and commented" should have 2 upvotes
    And the "good" item "Voted and commented" should have a comment "Still here"
