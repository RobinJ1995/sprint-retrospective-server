Feature: Retrospective Security

  Scenario: Set access key
    Given I create a new retrospective
    When I set the access key to "secret123"
    Then the retrospective should differ from the public version

  Scenario: Authenticate with valid key
    Given I create a new retrospective
    And I set the access key to "securepass"
    When I authenticate with "securepass"
    Then I should have a valid token

  Scenario: Authenticate with invalid key
    Given I create a new retrospective
    And I set the access key to "securepass"
    When I authenticate with "wrongpass"
    Then I should receive an authentication error
