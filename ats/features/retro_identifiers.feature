Feature: Retrospective Identifiers

  # Retrospective ids are free form text chosen by the client. The frontend
  # builds them as a uuid followed by a slug derived from the title, so they are
  # neither plain uuids nor of a fixed length.

  Scenario: A retrospective is addressed by the id the client chose
    Given I create a new retrospective with the id suffix "sprint-112-retro"
    When I set the title to "Sprint 112 Retro"
    And I add a "good" item "An item in a slugged retrospective"
    Then the retrospective should expose an identifier
    And the retrospective title should be "Sprint 112 Retro"
    And the retrospective should contain "good" item "An item in a slugged retrospective"

  Scenario Outline: Ids in the shapes the frontend generates are accepted
    Given I create a new retrospective with the id suffix "<suffix>"
    When I add a "good" item "An item"
    And I add a comment "A comment" to the "good" item "An item"
    Then the retrospective should expose an identifier
    And the retrospective should contain "good" item "An item"
    And the "good" item "An item" should have a comment "A comment"

    Examples:
      | suffix                                        |
      | retro                                         |
      | sprint-112-retro                              |
      | a-rather-long-retrospective-title-for-the-team |
      | -leading-and-trailing-dashes-                 |
      | 2024-11-04                                    |

  Scenario: An id as long as the frontend allows is accepted
    Given I create a new retrospective with an id of 128 characters
    When I set the title to "Long id retro"
    And I add a "good" item "An item under a long id"
    Then the retrospective should expose an identifier
    And the retrospective title should be "Long id retro"
    And the retrospective should contain "good" item "An item under a long id"

  Scenario: Ids that differ only in case address different retrospectives
    Given I create a new retrospective with the id suffix "cased-retro"
    And I also have a retrospective with the id suffix "CASED-RETRO"
    When I add a "good" item "Only in the lowercase retro"
    And I add a "good" item "Only in the uppercase retro" to the second retrospective
    Then the retrospective should contain "good" item "Only in the lowercase retro"
    And the retrospective should not contain "good" item "Only in the uppercase retro"
    And the second retrospective should contain "good" item "Only in the uppercase retro"
    And the second retrospective should not contain "good" item "Only in the lowercase retro"

  Scenario: Retrospectives sharing an id prefix stay separate
    Given I create a new retrospective with the id suffix "first"
    And I also have a retrospective with the id suffix "first-and-then-some"
    When I set the title to "The shorter one"
    And I add a "good" item "Only in the shorter one"
    Then the retrospective title should be "The shorter one"
    And the second retrospective should not contain "good" item "Only in the shorter one"

  Scenario: A token is scoped to the exact id it was issued for
    Given I create a new retrospective with the id suffix "token-scope"
    And I also have a retrospective with the id suffix "TOKEN-SCOPE"
    When I use the second retrospective's token against the first retrospective
    Then the response status should be 401
    And the response error key should be "INVALID_AUTH"

  Scenario: Access keys are kept per retrospective, not per id prefix
    Given I create a new retrospective with the id suffix "protected"
    And I also have a retrospective with the id suffix "public"
    When I set the access key to "keepitsecret"
    Then the retrospective should differ from the public version
    And the second retrospective should still be open
    And the response should not reveal the access key
