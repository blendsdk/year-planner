# Licence and permitted uses

Year Planner for React uses the **Year Planner Internal Use License 1.0**.
It is **source-available**, with free internal business use and modification.
It is not an open-source licence: redistribution and external services are
restricted. The complete [LICENSE](https://github.com/blendsdk/year-planner/blob/main/LICENSE)
controls; this page is a summary.

## Permission examples

These examples concern copies received under the internal-use licence. Each
permission remains subject to its conditions, including notices and access control.

| Scenario | Under this licence | Section |
| --- | --- | --- |
| A company uses the planner for its own staff, resources or customer projects | Allowed, including for-profit businesses | 2 |
| An individual uses it privately | Allowed | 2 |
| Modify the component or keep internal application source private | Allowed | 2 |
| Host the staff application in a cloud account | Allowed with restricted access | 3 |
| Send JavaScript and CSS to staff browsers, including remote staff | Allowed | 3 |
| A controlled group company uses the same internal application | Allowed while the defined control relationship exists | 1–3 |
| Hire a contractor to build or maintain your internal application | Allowed under the provider conditions; the contractor may charge for that work | 3 |
| A host operates a separate internal deployment on each client's behalf | Allowed under each client's own licence and provider conditions | 3 |
| Put the component in a private company registry, CI system or backup | Allowed within the permitted access boundary | 3 |
| Give customers interactive or read-only access to the planner | Requires separate permission, even if free or behind a login | 4 |
| Offer a SaaS, white-label planner or managed planning service to others | Requires separate permission | 4 |
| Sell or give away an app, template, container or component containing it | Requires separate permission | 4 |
| Publish a modified package or mirror to a public registry or website | Requires separate permission | 4 |
| Offer an API that runs customers' planning requests and returns only outputs | Requires separate permission | 4–5 |
| Share a PDF, screenshot, printout or data export of your internal plan with a customer | Allowed; no component code or interactive application may be included | 5 |
| Submit a patch to the official project | Allowed under the contribution policy | 6 |
| View or fork the public repository within GitHub | Separate GitHub service rights remain intact | 6, 8 |
| Evaluate the maintainer's official public demo | Allowed; no general reuse permission follows | 6 |
| Use a previously MIT-licensed copy for redistribution or SaaS | Governed by that MIT grant, which remains valid | 8 |

“Internal” describes who uses the component and for what purpose, not where the
server runs. Calling an external service “internal to each customer” does not
make the service provider's offering permitted. A contractor who acts for your
organization is different from a customer using your product.

Static outputs may be shared or sold when they come from permitted internal
use. This allows a construction firm to send its project schedule to a client.
It does not permit running a planning service for clients by returning only
images or documents instead of an interactive planner.

## Notices and private changes

Keep the licence and attribution with copies. A bundled browser deployment may
use an accompanying notices file or an accessible legal-notices page. A visible
badge in the planner is not required. Mark modified source files and retain
third-party notices. You do not have to publish internal source or modifications.

## Contributions and commercial solutions

The [contribution policy](https://github.com/blendsdk/year-planner/blob/main/CONTRIBUTING.md)
requires a signed origin certification and an explicit grant to BlendSDK. Contributors keep
ownership, while the additional grant allows the maintainer to distribute and
sublicense intentionally submitted contributions, including within commercial
solutions. Private modifications are not automatically contributed.

The project's certification uses `Signed-off-by`. It does not claim to be
[DCO 1.1](https://developercertificate.org/), whose text assumes an open-source
licence. The CI job's historical name, `dco`, refers to the sign-off check.

A rights holder may sell solutions using work it owns or has sufficient rights
to use. Changing this project's licence does not grant ownership of third-party
work.

Dependencies keep their own licences. Separate permission for external use
must be obtained in writing from the maintainer; no price, support tier or
commercial licence offer is included here.

## Earlier MIT copies and the release boundary

Earlier MIT grants continue under their original conditions. Recipients can
continue to use, modify, redistribute and build services from material covered
by those grants. This change cannot withdraw that permission, including for
unchanged material already made available under MIT.

New material offered only under the internal-use licence does not acquire MIT
permissions just because an earlier version was MIT-licensed. Check the licence
and provenance of the actual material you use. The licence change is recorded
as a pending release change; it does not rewrite historical versions or tags.

## Licence form and limits of review

This is a project-specific licence, not the unmodified PolyForm licence.
[PolyForm Internal Use 1.0.0](https://polyformproject.org/licenses/internal-use/1.0.0)
provided a useful comparison, but the project needs explicit browser delivery,
provider, output-sharing and external-service boundaries.

The package metadata uses `SEE LICENSE IN LICENSE`, following
[npm's custom-licence guidance](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#license).
It does not use a standard SPDX licence identifier. The repository-access clause
preserves the separate rights described in
[GitHub's terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#5-license-grant-to-other-users).

The wording has been checked against the scenarios above and repository
metadata. This is a drafting and consistency review, not a legal opinion on
enforceability or ownership. Applicable law supplies the governing-law rules;
the licence does not invent a jurisdiction or a legal entity name.
