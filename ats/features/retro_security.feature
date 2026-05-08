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

  Scenario: Reject short access key
    Given I create a new retrospective
    When I try to set the access key to "ab"
    Then the response status should be 500
    And the response should include an error message containing "Internal Server Error"

  Scenario: Authentication is required for retrospective access
    Given I create a new retrospective
    When I request the retrospective without authentication
    Then the response status should be 401
    And the response should include an error message containing "Authentication is required"

  Scenario: Admin endpoints require admin key
    Given I create a new retrospective
    When I request the "_raw" admin endpoint without admin permissions
    Then the response status should be 401
    When I request the "_actions" admin endpoint without admin permissions
    Then the response status should be 401

  Scenario: Admin endpoints are accessible with admin key
    Given I create a new retrospective
    And I set the access key to "securepass"
    And I set the title to "Retro title"
    When I request the "_raw" admin endpoint with admin permissions
    Then the response status should be 200
    And the raw retrospective should include access key "securepass"
    When I request the "_actions" admin endpoint with admin permissions
    Then the response status should be 200
    And the response should be a list of actions
    And the action log should contain at least 2 entries
