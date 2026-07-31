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

  Scenario: An unprotected retrospective can be opened without an access key
    Given I create a new retrospective
    When I try to authenticate with "any key at all"
    Then the response status should be 200
    And the response should contain a token

  Scenario: An access key can be replaced and the old key stops working
    Given I create a new retrospective
    And I set the access key to "firstkey"
    And I set the access key to "secondkey"
    When I try to authenticate with "firstkey"
    Then the response status should be 401
    And the response error key should be "INVALID_AUTH"
    When I try to authenticate with "secondkey"
    Then the response status should be 200
    And the response should contain a token

  Scenario: An access key of the minimum length is accepted
    Given I create a new retrospective
    When I try to set the access key to a value of 3 characters
    Then the response status should be 201

  Scenario: An access key below the minimum length is rejected
    Given I create a new retrospective
    When I try to set the access key to a value of 2 characters
    Then the response status should be 500

  Scenario: Opening a protected retrospective without a key reports that authentication is required
    Given I create a new retrospective
    And I set the access key to "protectme"
    When I request the retrospective without authentication
    Then the response status should be 401
    And the response error key should be "AUTH_REQUIRED"

  Scenario: A wrong access key reports an invalid access key
    Given I create a new retrospective
    And I set the access key to "protectme"
    When I try to authenticate with "notthekey"
    Then the response status should be 401
    And the response error key should be "INVALID_AUTH"

  Scenario: The access key is never disclosed through the public endpoint
    Given I create a new retrospective
    And I set the access key to "topsecret"
    Then the response should not reveal the access key

  Scenario: A token issued for one retrospective is not valid for another
    Given I create a new retrospective
    And I have a second retrospective
    When I use the second retrospective's token against the first retrospective
    Then the response status should be 401
    And the response error key should be "INVALID_AUTH"

  Scenario Outline: A malformed token is rejected on every endpoint
    Given I create a new retrospective
    When I send a "<method>" request to "<path>" with an invalid token
    Then the response status should be 401
    And the response error key should be "INVALID_AUTH"

    Examples:
      | method | path      |
      | GET    | /         |
      | POST   | /good     |
      | POST   | /bad      |
      | POST   | /action   |
      | PUT    | /title    |
      | PUT    | /voteMode |
      | PUT    | /accessKey |
      | GET    | /_raw     |
      | GET    | /_actions |

  Scenario Outline: A missing token is rejected on every endpoint
    Given I create a new retrospective
    When I send an unauthenticated "<method>" request to "<path>"
    Then the response status should be 401
    And the response error key should be "AUTH_REQUIRED"

    Examples:
      | method | path      |
      | GET    | /         |
      | POST   | /good     |
      | POST   | /bad      |
      | POST   | /action   |
      | PUT    | /title    |
      | PUT    | /voteMode |
      | PUT    | /accessKey |
      | GET    | /_raw     |
      | GET    | /_actions |

  Scenario: Admin endpoints reject an incorrect admin key
    Given I create a new retrospective
    When I request the "_raw" admin endpoint with an incorrect admin key
    Then the response status should be 401
    When I request the "_actions" admin endpoint with an incorrect admin key
    Then the response status should be 401

  Scenario: A retrospective stays readable with its own token after an access key is set
    Given I create a new retrospective
    And I add a "good" item "Before protection"
    When I set the access key to "lockitdown"
    Then the retrospective should contain "good" item "Before protection"
