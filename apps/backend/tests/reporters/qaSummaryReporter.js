const path = require('path')

class QaSummaryReporter {
  onRunComplete(_contexts, results) {
    const total = results.numTotalTests
    const passed = results.numPassedTests
    const failed = results.numFailedTests
    const skipped = results.numPendingTests
    const startTime = Number(results.startTime || 0)
    const endTime = Number(results.endTime || Date.now())
    const durationSec = startTime > 0 ? ((endTime - startTime) / 1000).toFixed(2) : 'N/A'

    const summary = [
      '',
      '================ QA AUTOMATION SUMMARY ================',
      `Total tests   : ${total}`,
      `Passed        : ${passed}`,
      `Failed        : ${failed}`,
      `Skipped       : ${skipped}`,
      `Duration (s)  : ${durationSec}`,
      `Coverage dir  : ${path.resolve('tests/reports/coverage')}`,
      '=======================================================',
      '',
    ].join('\n')

    // eslint-disable-next-line no-console
    console.log(summary)

    if (failed > 0) {
      // eslint-disable-next-line no-console
      console.error('Failed suites:')
      results.testResults
        .filter((suite) => suite.numFailingTests > 0)
        .forEach((suite) => {
          // eslint-disable-next-line no-console
          console.error(`- ${suite.testFilePath} (${suite.numFailingTests} failing tests)`)
        })
    }
  }
}

module.exports = QaSummaryReporter
