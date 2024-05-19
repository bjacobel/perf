# perf

Performance testing scripts.


---

```
perf <command>

Commands:
perf analyze-dist <dir>                   display sizes of built assets in
[compareBaseline] [emitBaseline]          dist, optionally compared to a
[brotli]                                  previous run
perf analyze-stats [compareBaseline]      display sizes reported by
[emitBaseline]                            compilation stats file, optionally
                                          compared to a previous run
perf lighthouse                           runs the Lighthouse perf tool and
                                          opens results in the browser
perf treemap                              generate a treemap for the webpack
                                          bundle and open it in the browser

Options:
--version  Show version number                                       [boolean]
--help     Show help                                                 [boolean]
```
