Feature: Service Health

  Scenario: Health endpoint reports dependency status
    When I request service health
    Then the response status should be 200
    And the health check should report all dependencies as healthy

  Scenario: Health endpoint does not require authentication
    When I request service health
    Then the response status should be 200
    And the response content type should be "application/json"

  Scenario: The service stays healthy while it is being used
    Given I create a new retrospective
    And I set the title to "Health check retro"
    And I add a "good" item "Health check item"
    When I request service health
    Then the response status should be 200
    And the health check should report all dependencies as healthy
